// 模块级共享状态：configTick / 语言 / 用量窗口与轮询单例 / 窄屏宽度
import { createSignal } from "solid-js"
import { createT, detectLang } from "./i18n"
import type { LangCode } from "./i18n"
import type { WindowKey } from "./usage"

// 设置（语言/关注模型）保存后递增，面板监听它立即刷新
export const [configTick, setConfigTick] = createSignal(0)

// 模块级共享语言信号：/go-lang 或首次引导切换后，面板和命令实时响应
export const [langCode, setLangCode] = createSignal<LangCode>(detectLang())
export const t = createT(() => langCode())

// 用量面板窗口切换信号（5h/本周/本月）
export const [usageWindow, setUsageWindow] = createSignal<WindowKey>("5h")

// 用量轮询单例闸门：/session 切换会重复挂载面板且宿主可能不销毁旧实例，
// 仅首个实例持有扫描定时器，防止叠加导致重复聚合。
let _usagePollOwner: object | null = null

export function claimUsagePoll(token: object): boolean {
  if (_usagePollOwner) return false
  _usagePollOwner = token
  return true
}

export function releaseUsagePoll(token: object): void {
  if (_usagePollOwner === token) _usagePollOwner = null
}

// ── 窄屏保护：仿原生"窄窗隐藏侧栏"行为 ─────────────
// 终端总列数低于阈值时整体隐藏面板，让出空间给主区（阈值可调）
export const SIDEBAR_MIN_COLS = 90
export const [termCols, setTermCols] = createSignal<number>(
  (typeof process !== "undefined" && (process as any).stdout?.columns) || 100
)
try {
  ;(process as any).stdout.on("resize", () => {
    const c = (((process as any).stdout?.columns as number) | 0)
    if (c > 0) setTermCols(c)
  })
} catch {}