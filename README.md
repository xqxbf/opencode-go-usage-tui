# opencode-go-usage-tui

OpenCode TUI 插件：在侧边栏实时统计**你自己实际使用的**会话用量——按 5 小时 / 本周 / 本月三个时间窗口统计各模型的请求次数与 Token 用量（输入 / 输出 / 缓存读 / 缓存写）。

> 注意：统计的是本地会话的真实用量，不是官方价格或限额。官方价格/限额展示链路已在 2.0.0 移除。

## 功能

- **用量统计面板**：侧边栏列出本机已注册的模型，每行显示对应时间窗口的请求数；点行展开看输入 / 输出 / 缓存读 / 缓存写 Token 明细
- **时间窗口切换**：点击表头的 `[5h]` / `[周]` / `[月]` 切换统计窗口
- **关注模型过滤**：`/go-settings` →「关注的模型」可勾选只统计指定模型
- **命令**：`/go-lang` 切换界面语言（中文 / English），`/go-settings` 打开设置
- **中英双语**：跟随系统语言自动选择，可随时切换

## 安装

从 GitHub 安装（无需发布到 npm）：

```bash
git clone https://github.com/xqxbf/opencode-go-usage-tui.git
cd opencode-go-usage-tui
npm install
npm run build
```

然后在 OpenCode 中把插件目录加入插件搜索路径（在 `opencode.json` 中配置 `config.pluginPaths` 指向该目录），重启即可。`dist/tui.js` 已提交，也可以直接使用构建产物而不必本地构建。

## 配置

配置文件 `~/.config/opencode/go-usage-config.json`（不存在时使用默认值）：

```json
{
  "ui": { "price_panel": true },
  "focus_models": []
}
```

- `ui.price_panel`：是否显示用量统计面板（默认 `true`）
- `focus_models`：关注的模型 ID 列表（空 = 显示全部；可在 `/go-settings` 中维护）

## 开发

```bash
npm run build   # esbuild 打包到 dist/tui.js
npx tsc --noEmit  # 类型检查
```

## 变更日志

见 [CHANGELOG.md](./CHANGELOG.md)。

## License

[MIT](./LICENSE) © xqxbf