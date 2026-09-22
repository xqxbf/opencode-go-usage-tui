// 共享工具函数与常量
import type { Context } from "@opencode/plugin/tui/context"
import type { Store } from "solid-js/store"
import type { LangCode } from "./i18n"

export function visualWidth(s: string): number {
  let w = 0
  for (const c of s) {
    const code = c.codePointAt(0) ?? 0
    w += (code >= 0x1100 && code <= 0x115F) ||
         (code >= 0x2E80 && code <= 0xA4CF) ||
         (code >= 0xAC00 && code <= 0xD7A3) ||
         (code >= 0xF900 && code <= 0xFAFF) ||
         (code >= 0xFF01 && code <= 0xFF60) ||
         (code >= 0xFFE0 && code <= 0xFFE6) ? 2 : 1
  }
  return w
}

export const FALLBACK = {
  primary: "#8B9DAF",
  text: "#C5C5BB",
  muted: "#7A7A72",
  success: "#9CAF8B",
  warning: "#C5B88D",
  error: "#B08A8A",
  border: "#6B6B63",
} as const

export function hex(raw: any): string {
  if (typeof raw === "string" && raw.startsWith("#") && raw.length >= 7) return raw
  if (raw && typeof raw === "object" && typeof raw.r === "number") {
    const r = Math.round(raw.r * 255), g = Math.round(raw.g * 255), b = Math.round(raw.b * 255)
    return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")
  }
  return ""
}

// ── V2 持久化偏好（语言/首启标记）：context.storage.store 返回 solid store，
// 首次调用注册（同一插件进程内复用同一 store），跨重启保持。
export interface PluginPrefs { lang: LangCode | null; onboarded: boolean }
export type PrefsHandle = readonly [Store<PluginPrefs>, (mutation: (draft: PluginPrefs) => void) => Promise<void>]

let prefsHandle: PrefsHandle | null = null
export function prefsStore(context: Context): PrefsHandle {
  // ??=：单例注册，同插件进程内复用同一 solid store
  return prefsHandle ??= context.storage.store("go-usage", { initial: { lang: null, onboarded: false } })
}

// 安全 toast：宿主 API 缺失/变化时降级为无操作，避免崩溃
export function toastTry(context: Context, opts: { title?: string; message: string; variant?: "info" | "success" | "warning" | "error"; duration?: number; sessionID?: string }): void {
  try { context.ui.toast.show(opts) } catch { /* 忽略 */ }
}