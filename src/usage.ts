// 模型用量聚合：把各会话的 assistant 消息按模型 + 时间窗口（5h/本周/本月）汇总。
// 数据源：TUI context.data.session.list() + session.message.list(sid)。
// 仅 type==="assistant" 且带 tokens 的消息计费；time.created 为毫秒时间戳。
import type { SessionMessageInfo } from "@opencode/client"

export type WindowKey = "5h" | "week" | "month"

export interface UsageTotals {
  requests: number       // 窗口内的 assistant 消息条数
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

export type UsageByWindow = Partial<Record<WindowKey, UsageTotals>>

export const WINDOW_KEYS: WindowKey[] = ["5h", "week", "month"]

// 窗口起点（本地时间）：5h=当前-5 小时；week=本周一 00:00；month=本月 1 日 00:00
export function windowStart(key: WindowKey, now: number): number {
  const d = new Date(now)
  if (key === "5h") return now - 5 * 3600_000
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  if (key === "week") return dayStart - (d.getDay() === 0 ? 6 : d.getDay() - 1) * 86400_000
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

export function emptyTotals(): UsageTotals {
  return { requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
}

// 聚合：modelID(取 model.id 的末段) -> 各窗口用量。窗口嵌套：5h 内的消息同时计入周/月。
export function aggregateUsage(messages: SessionMessageInfo[], now: number): Map<string, UsageByWindow> {
  const starts: Record<WindowKey, number> = {
    "5h": windowStart("5h", now),
    week: windowStart("week", now),
    month: windowStart("month", now),
  }
  const map = new Map<string, UsageByWindow>()
  for (const m of messages) {
    if (m.type !== "assistant" || !m.tokens || !m.model) continue
    const created = m.time?.created ?? 0
    if (!created) continue
    const modelID = m.model.id.split("/").pop() || m.model.id
    let by = map.get(modelID)
    if (!by) { by = {}; map.set(modelID, by) }
    for (const key of WINDOW_KEYS) {
      if (created < starts[key]) continue
      const t = by[key] ?? emptyTotals()
      t.requests++
      t.input += m.tokens.input
      t.output += m.tokens.output
      t.cacheRead += m.tokens.cache?.read ?? 0
      t.cacheWrite += m.tokens.cache?.write ?? 0
      by[key] = t
    }
  }
  return map
}