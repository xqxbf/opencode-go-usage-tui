/** @jsxImportSource @opentui/solid */
import { Plugin, PluginContextProvider } from "@opencode/plugin/tui"
import type { Context } from "@opencode/plugin/tui/context"
import { setLangCode, t } from "./state"
import { detectLang } from "./i18n"
import { prefsStore } from "./helpers"
import { PricePanel } from "./panels/PricePanel"
import { runLangDialog, runSettingsDialog } from "./ui/dialogs"

export default Plugin.define({
  id: "opencode-go-usage-tui",
  setup(context: Context) {
    // ① 侧边栏面板：模型列表（本地注册表 × 官方限额缓存对拍）
    context.ui.slot({
      append: "sidebar.content",
      render: () => (
        <PluginContextProvider value={context}>
          <PricePanel />
        </PluginContextProvider>
      ),
    })

    // ② 斜杠命令：V1 api.command.register → V2 keymap.layer
    // 注意：keymap.layer 需要宿主在渲染 slot 内容时挂载的 Keymap.Provider，
    // 不能直接在 setup() 里调用（实测报 "Keymap.Provider is missing"），
    // 因此注册在 append:"app" 的 render 回调中（官方文档 canonical 写法）。
    context.ui.slot({
      append: "app",
      render: () => {
        context.keymap.layer(() => ({
          mode: "global",
          commands: [
            {
              id: "go-usage.lang",
              title: t("langCmdTitle"),
              description: t("langCmdDesc"),
              group: "Go Usage",
              palette: true,
              slash: { name: "go-lang" },
              run: async () => { await runLangDialog(context) },
            },
            {
              id: "go-usage.settings",
              title: t("settingsTitle"),
              description: t("settingsDesc"),
              group: "Go Usage",
              palette: true,
              slash: { name: "go-settings" },
              run: async () => { await runSettingsDialog(context) },
            },
          ],
        }))
        return null
      },
    })

    // ③ 语言恢复 + 首启引导：V1 api.kv → V2 context.storage
    const [prefs, setPrefs] = prefsStore(context)
    const saved = prefs.lang
    if (saved === "zh" || saved === "en") setLangCode(saved)
    else setLangCode(detectLang())

    let onboarding: ReturnType<typeof setTimeout> | undefined
    if (!prefs.onboarded) {
      void setPrefs((d) => { d.onboarded = true })
      onboarding = setTimeout(() => { void runLangDialog(context) }, 1500)
    }
    return () => { if (onboarding) clearTimeout(onboarding) }
  },
})