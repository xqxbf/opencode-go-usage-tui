// 双面板复用 hooks
import { createSignal, createEffect, onCleanup } from "solid-js"
import { FALLBACK, hex } from "./helpers"
import type { ResolvedTheme } from "@opencode/theme/tui"

// V1 扁平主题 → V2 语义 token 树（已对照 @opencode/theme@2.0.12 ResolvedThemeTokens）
export function useThemeColors(theme: ResolvedTheme): () => Record<string, string> {
  const [pal, setPal] = createSignal<Record<string, string>>({ ...FALLBACK })
  createEffect(() => {
    const th = theme as any
    const src: Record<string, string> = {
      text: th?.text?.base,
      muted: th?.text?.muted,
      primary: th?.text?.action?.primary?.base,
      success: th?.text?.feedback?.success?.base,
      warning: th?.text?.feedback?.warning?.base,
      error: th?.text?.feedback?.error?.base,
      border: th?.border?.base,
    }
    const p: Record<string, string> = { ...FALLBACK }
    for (const k of Object.keys(FALLBACK)) {
      const h = hex(src[k])
      if (h) p[k] = h
    }
    setPal(p)
  })
  return () => pal()
}

// 面板盒子：boxEl 引用 + panelWidth 信号 + 防抖的"仅宽度变化才更新"onSizeChange 守卫。
// onWidthChange 在宽度真正变化时调用（价格面板用于补 renderTick）
export function usePanelBox(onWidthChange?: () => void) {
  const [panelWidth, setPanelWidth] = createSignal(24)
  let boxEl: any
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null
  const boxRef = (el: any) => { boxEl = el }
  const onSizeChange = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      if (!boxEl) return
      const w = Math.max(20, boxEl.width ?? 24)
      // 仅在宽度真正变化时才更新：重渲染引起的高度变化不应再触发，否则
      // 缩放时会陷入"重渲染→盒子变高→onSizeChange→重渲染"的死循环
      if (w !== panelWidth()) {
        setPanelWidth(w)
        onWidthChange?.()
      }
    }, 100)
  }
  // 供价格面板的挂载宽度轮询使用：读取实时 boxEl.width 并同步 panelWidth；返回是否已测得宽度
  const syncPanelWidth = (): boolean => {
    if (!boxEl) return false
    const w = Math.max(20, boxEl.width ?? 24)
    if (w !== panelWidth()) {
      setPanelWidth(w)
      onWidthChange?.()
    }
    return boxEl.width > 0
  }
  onCleanup(() => { if (resizeTimeout) { clearTimeout(resizeTimeout); resizeTimeout = null } })
  return { boxRef, panelWidth, onSizeChange, syncPanelWidth }
}