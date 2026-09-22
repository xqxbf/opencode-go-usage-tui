/** @jsxImportSource @opentui/solid */
import { createSignal, createEffect, onMount, onCleanup, Show } from "solid-js"
import type { JSX } from "@opentui/solid"
import { usePlugin } from "@opencode/plugin/tui"
import type { SessionMessageInfo } from "@opencode/client"
import { loadConfig } from "../config"
import type { LoadedConfig } from "../config"
import { buildLocalRows } from "../pricing"
import type { LocalModelRow } from "../pricing"
import { aggregateUsage } from "../usage"
import type { UsageByWindow, WindowKey } from "../usage"
import {
  t, termCols, SIDEBAR_MIN_COLS, configTick,
  usageWindow, setUsageWindow, claimUsagePoll, releaseUsagePoll,
} from "../state"
import { visualWidth } from "../helpers"
import { usePanelBox, useThemeColors } from "../hooks"

// 用量统计面板：每模型在本机所有会话中的真实 token 消耗（输入/输出/缓存）与请求次数，
// 按 5h / 本周 / 本月 窗口聚合（表头点击切换）。数据来自 context.data.session.message。
export function PricePanel(): JSX.Element {
  const context = usePlugin()
  const [open, setOpen] = createSignal(true)
  // 本地模型注册表（用于行名；若读取失败则为空，面板显示加载中提示）
  const [localRows, setLocalRows] = createSignal<LocalModelRow[]>([])
  // modelID -> 各窗口用量
  const [usageMap, setUsageMap] = createSignal<Map<string, UsageByWindow>>(new Map())
  const [pageError, setPageError] = createSignal("")
  const [renderTick, setRenderTick] = createSignal(0)
  // 数据到达那帧盒子常在重布局，延迟一帧再创建列表文本，避免"模型间空行"
  const [listReady, setListReady] = createSignal(false)
  const [expandedId, setExpandedId] = createSignal<string | null>(null)
  const [updated, setUpdated] = createSignal(0)
  const [cfg, setCfg] = createSignal<LoadedConfig>(loadConfig())
  createEffect(() => { void configTick(); setCfg(loadConfig()) })
  const { boxRef, panelWidth, onSizeChange, syncPanelWidth } = usePanelBox(() => setRenderTick((v) => v + 1))
  const colors = useThemeColors(context.theme)

  createEffect(() => {
    const rows = localRows()
    if (rows.length > 0) {
      const id = setTimeout(() => setListReady(true), 150)
      onCleanup(() => clearTimeout(id))
    } else {
      setListReady(false)
    }
  })
  // 列表稳定后补几次重渲染，让 @opentui 重新测量每行高度，自愈空行
  createEffect(() => {
    if (!(listReady() && localRows().length > 0)) return
    const t1 = setTimeout(() => setRenderTick((v) => v + 1), 250)
    const t2 = setTimeout(() => setRenderTick((v) => v + 1), 600)
    const t3 = setTimeout(() => setRenderTick((v) => v + 1), 1000)
    onCleanup(() => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) })
  })

  // 扫描所有会话的 assistant 消息，按模型聚合用量。
  // forceSync=true 时先同步全部会话消息（保证首次数据新鲜）；之后只读缓存。
  async function scanUsage(forceSync: boolean): Promise<void> {
    try {
      const sessions = context.data.session.list() ?? []
      if (forceSync && sessions.length > 0) {
        for (let i = 0; i < sessions.length; i += 5) {
          await Promise.all(sessions.slice(i, i + 5).map((s) => context.data.session.message.sync(s.id)))
        }
      }
      const msgs: SessionMessageInfo[] = []
      for (const s of sessions) {
        const list = context.data.session.message.list(s.id)
        if (list) msgs.push(...list)
      }
      setUsageMap(aggregateUsage(msgs, Date.now()))
      setUpdated(Date.now())
      setPageError("")
    } catch {
      setPageError(t("usageLoadError"))
    }
  }

  let widthSyncTimer: ReturnType<typeof setTimeout> | null = null
  let scanTimer: ReturnType<typeof setInterval> | null = null
  let scanRunning = false
  const pollToken = {}
  const isOwner = claimUsagePoll(pollToken)

  onMount(() => {
    // 宽度同步轮询：首帧 boxEl.width 未测量时文本按临时窄宽度折行，就绪后强制重渲染
    let tries = 0
    const syncWidth = () => {
      tries++
      if (syncPanelWidth()) {
        setRenderTick((v) => v + 1)
        widthSyncTimer = setTimeout(() => setRenderTick((v) => v + 1), 150)
        return
      }
      if (tries < 50) widthSyncTimer = setTimeout(syncWidth, 80)
    }
    widthSyncTimer = setTimeout(syncWidth, 30)

    // 模型注册表（行名）
    const loadReg = async () => {
      try {
        await context.data.location.model.sync()
        const reg = context.data.location.model.list() ?? []
        setLocalRows(buildLocalRows(reg.map((m) => ({ id: m.id, providerID: m.providerID, modelID: m.modelID, name: m.name }))))
      } catch {
        setLocalRows([])
      }
    }
    void loadReg()

    // 用量扫描（全进程仅首个实例持有定时器，防止 /session 切换重复挂载叠加）
    if (isOwner) {
      const runScan = async (force: boolean) => {
        if (scanRunning) return
        scanRunning = true
        try { await scanUsage(force) } finally { scanRunning = false }
      }
      void runScan(true)
      scanTimer = setInterval(() => { void runScan(false) }, 60000)
    }

    onCleanup(() => {
      if (widthSyncTimer) clearTimeout(widthSyncTimer)
      if (scanTimer) clearInterval(scanTimer)
      if (isOwner) releaseUsagePoll(pollToken)
    })
  })

  // 表头点击循环切换窗口
  const cycleWindow = () => {
    const next: Record<WindowKey, WindowKey> = { "5h": "week", week: "month", month: "5h" }
    setUsageWindow(next[usageWindow()])
  }
  const winLabel = (w: WindowKey) => w === "5h" ? t("usageWin5h") : w === "week" ? t("usageWinWeek") : t("usageWinMonth")

  // 大数缩写：131072 → "128K"、1048576 → "1M"
  function fmtWindow(n: number | undefined): string {
    if (n == null) return "-"
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 !== 0 ? 1 : 0)}M`
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(n)
  }

  function visualPadEnd(s: string, w: number): string {
    const cur = visualWidth(s)
    if (cur >= w) return s
    return s + " ".repeat(w - cur)
  }

  function abbreviateName(name: string, maxLen: number): string {
    if (visualWidth(name) <= maxLen) return name
    let out = ""
    let w = 0
    for (const c of name) {
      const cw = visualWidth(c)
      if (w + cw > maxLen - 1) break
      out += c
      w += cw
    }
    return out + "…"
  }

  function justify(label: string, value: string): string {
    void renderTick()
    const outer = panelWidth()
    const gauge = Math.max(10, outer - 4)
    const used = visualWidth(label) + visualWidth(value)
    return label + " ".repeat(Math.max(1, gauge - used)) + value
  }

  function renderRow(row: LocalModelRow) {
    const totals = usageMap().get(row.id)?.[usageWindow()]
    const expanded = expandedId() === row.id
    const name = abbreviateName(row.name, 18)
    const req = totals ? `${totals.requests}` : "\u2014"
    const ind = expanded ? " \u25be" : " \u25b8"
    const fg = totals ? colors().text : colors().muted
    const rowEl = (
      <text fg={fg} selectable={false} onMouseUp={(e) => { e.preventDefault(); setExpandedId(expanded ? null : row.id) }}>
        {justify(name, req + ind)}
      </text>
    )
    if (!expanded) return rowEl
    if (!totals) {
      return <>{rowEl}<text fg={colors().muted} selectable={false}>{`  \u2514 ${t("usageNone")}`}</text></>
    }
    const items: [string, string][] = [
      [t("usageReqs"), String(totals.requests)],
      [t("usageInput"), fmtWindow(totals.input)],
      [t("usageOutput"), fmtWindow(totals.output)],
      [t("usageCacheRead"), fmtWindow(totals.cacheRead)],
      [t("usageCacheWrite"), fmtWindow(totals.cacheWrite)],
    ]
    return (
      <>
        {rowEl}
        {items.map(([label, val], i) => {
          const conn = i < items.length - 1 ? "\u251c" : "\u2514"
          return <text fg={colors().muted} selectable={false}>{visualPadEnd(`  ${conn} ${label}:`, 8) + val}</text>
        })}
      </>
    )
  }

  const sep = () => {
    void renderTick()
    const outer = panelWidth()
    return "\u2500".repeat(Math.max(1, outer - 4))
  }

  // 窄屏保护：终端总列数不足时整体隐藏（仿原生侧栏隐藏行为，最大化后恢复）
  return (
    <Show when={termCols() >= SIDEBAR_MIN_COLS}>
    <box
      border
      borderColor={colors().border}
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
      gap={0}
      ref={boxRef}
      onSizeChange={onSizeChange}
      >
      <text selectable={false} onMouseUp={() => setOpen(o => !o)}>
        <span style={{ fg: colors().muted }}>{open() ? "\u25bc " : "\u25b6 "}</span>
        <span style={{ fg: colors().primary }}><b>{t("usageTitle")}</b></span>
        <Show when={localRows().length > 0}>
          <span style={{ fg: colors().muted }}> ({localRows().length})</span>
        </Show>
        <span style={{ fg: colors().muted }}>{sep().slice(visualWidth((open() ? "\u25bc " : "\u25b6 ") + t("usageTitle") + (localRows().length > 0 ? ` (${localRows().length})` : "")))}</span>
      </text>

      <Show when={open()}>
        <text fg={colors().warning} selectable={false} onMouseUp={(e) => { e.preventDefault(); cycleWindow() }}>
          {justify(t("usageModel"), `${t("usageReqs")} [${winLabel(usageWindow())}]`)}
        </text>
        <text fg={colors().muted} selectable={false}>{sep()}</text>

        <Show when={localRows().length > 0} fallback={
          <text fg={colors().muted} selectable={false}>{t("usageLoading")}</text>
        }>
          {listReady() ? localRows().filter((row) =>
            cfg().focusModels.length === 0 || cfg().focusModels.includes(row.id)
          ).map((row) => renderRow(row)) : null}
          <Show when={pageError()}>
            <text fg={colors().error} selectable={false}>{pageError()}</text>
          </Show>
          <text fg={colors().muted} selectable={false}>
            {justify(t("usageUpdated"), updated() ? new Date(updated()).toLocaleTimeString() : "-")}
          </text>
        </Show>
      </Show>
    </box>
    </Show>
  )
}