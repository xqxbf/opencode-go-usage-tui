/** @jsxImportSource @opentui/solid */
import type { Context } from "@opencode/plugin/tui/context"
import { loadConfig, saveConfig } from "../config"
import { t, langCode, setLangCode, setConfigTick } from "../state"
import { prefsStore, toastTry } from "../helpers"
import { buildLocalRows } from "../pricing"
import type { LocalModelRow } from "../pricing"
import { LANG_META } from "../i18n"
import type { LangCode } from "../i18n"

// V2 对话框全部为 promise 式：prompt/select 取消时返回 undefined，用作提前退出判断。

export async function runLangDialog(context: Context): Promise<void> {
  const code = await context.ui.dialog.select<LangCode>({
    title: t("langTitle"),
    options: LANG_META.map((m) => ({
      title: `${m.label}${langCode() === m.code ? " \u2713" : ""}`,
      value: m.code,
    })),
  })
  if (!code) return
  setLangCode(code)
  const [, setPrefs] = prefsStore(context)
  await setPrefs((d) => { d.lang = code })
  toastTry(context, { message: code === "zh" ? t("langSwitchedZh") : t("langSwitchedEn") })
}

export async function runSettingsDialog(context: Context): Promise<void> {
  await settingsMenu(context)
}

async function settingsMenu(context: Context): Promise<void> {
  const cfg = loadConfig()
  const opt = await context.ui.dialog.select<string>({
    title: t("settingsTitle"),
    options: [
      { title: `${t("settingsFocus")} (${cfg.focusModels.length} ${t("countUnit")})`, value: "focus-models" },
    ],
  })
  if (!opt) return
  if (opt === "focus-models") {
    await focusLoop(context)
    await settingsMenu(context) // done → 回到设置菜单；cancel → 直接退出
  }
}

async function focusLoop(context: Context): Promise<void> {
  let lastSelected: string | undefined
  // 关注模型候选 = 本地实际生效的模型注册表
  let rows: LocalModelRow[] = []
  try {
    await context.data.location.model.sync()
    rows = buildLocalRows(context.data.location.model.list() ?? [])
  } catch { /* 注册表不可用时列表为空 */ }
  while (true) {
    const cur = loadConfig().focusModels
    const modelOptions = rows.map((r) => ({
      title: `${cur.includes(r.id) ? "\u2611" : "\u2610"} ${r.name}`,
      value: r.id,
    }))
    const focusOptions = [
      ...modelOptions,
      { title: `${t("focusAllTitle", { n: cur.length })}`, value: "select-all" },
      { title: t("focusNone"), value: "clear-all" },
      { title: `${t("focusDone")} (${t("focusSelected", { n: cur.length })})`, value: "done" },
    ]
    const opt = await context.ui.dialog.select<string>({
      title: t("settingsFocus"),
      current: lastSelected,
      options: focusOptions,
    })
    if (!opt) return // cancel → 退出设置
    if (opt === "done") return // 回到设置菜单
    if (opt === "select-all") {
      saveConfig({ focus_models: rows.map((r) => r.id) })
    } else if (opt === "clear-all") {
      saveConfig({ focus_models: [] })
    } else {
      const next = cur.includes(opt) ? cur.filter((id) => id !== opt) : [...cur, opt]
      saveConfig({ focus_models: next })
    }
    lastSelected = opt
    setConfigTick((v) => v + 1)
    toastTry(context, { variant: "success", message: t("settingsSaved") })
  }
}