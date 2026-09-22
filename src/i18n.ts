export type LangCode = "zh" | "en"

const ZH_T = {
  langTitle: "显示语言",
  langCmdTitle: "用量统计: 语言",
  langCmdDesc: "切换显示语言 | Switch display language",
  langSwitchedZh: "已切换为中文",
  langSwitchedEn: "Switched to English",
  // ── 用量统计面板 ──
  usageTitle: "用量统计",
  usageModel: "模型",
  usageLoading: "加载中...",
  usageWin5h: "5h",
  usageWinWeek: "周",
  usageWinMonth: "月",
  usageReqs: "请求",
  usageInput: "输入",
  usageOutput: "输出",
  usageCacheRead: "缓存读",
  usageCacheWrite: "缓存写",
  usageNone: "暂无用量记录",
  usageUpdated: "用量更新",
  usageLoadError: "用量查询失败",
  // ── 设置 / 关注模型 ──
  settingsTitle: "用量统计设置",
  settingsDesc: "设置显示语言与关注的模型",
  settingsFocus: "关注的模型",
  settingsSaved: "设置已保存",
  focusAllTitle: "全部显示（已选 {n}）",
  focusNone: "清空选择",
  focusDone: "完成",
  focusSelected: "已选 {n}",
  countUnit: "个",
} as const

export type Translation = { [K in keyof typeof ZH_T]: string }

const EN_T: Translation = {
  langTitle: "Display language",
  langCmdTitle: "Usage Stats: Language",
  langCmdDesc: "切换显示语言 | Switch display language",
  langSwitchedZh: "已切换为中文",
  langSwitchedEn: "Switched to English",
  // ── Usage stats panel ──
  usageTitle: "Usage Stats",
  usageModel: "Model",
  usageLoading: "Loading...",
  usageWin5h: "5h",
  usageWinWeek: "Wk",
  usageWinMonth: "Mo",
  usageReqs: "Req",
  usageInput: "In",
  usageOutput: "Out",
  usageCacheRead: "Cache In",
  usageCacheWrite: "Cache Wr",
  usageNone: "No usage yet",
  usageUpdated: "Updated",
  usageLoadError: "Usage query failed",
  // ── Settings / focused models ──
  settingsTitle: "Usage Stats Settings",
  settingsDesc: "Display language, focused models",
  settingsFocus: "Focused models",
  settingsSaved: "Settings saved",
  focusAllTitle: "Show all ({n} selected)",
  focusNone: "Clear selection",
  focusDone: "Done",
  focusSelected: "{n} selected",
  countUnit: "selected",
}

export const LANGS: Record<LangCode, Translation> = { zh: ZH_T, en: EN_T }

export const LANG_META: { code: LangCode; label: string }[] = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
]

export function applyParams(tpl: string, params?: Record<string, string | number>): string {
  if (!params) return tpl
  return tpl.replace(/\{(\w+)\}/g, (m, k: string) =>
    k in params ? String(params[k]) : m,
  )
}

export function createT(getCode: () => LangCode) {
  return (key: keyof Translation, params?: Record<string, string | number>): string =>
    applyParams(LANGS[getCode()][key], params)
}

export function detectLang(): LangCode {
  try {
    if (Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith("zh")) return "zh"
    return "en"
  } catch {
    return "en"
  }
}