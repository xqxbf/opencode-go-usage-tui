# opencode-go-usage-tui

An OpenCode TUI plugin that shows **your own real session usage** in the sidebar — requests and token counts per model, aggregated over three time windows: last 5 hours / this week / this month (input / output / cache read / cache write).

> Note: this tracks real local session usage, not official prices or quotas. The official price/limit display was removed in 2.0.0.

## Features

- **Usage stats panel**: lists models registered on your machine; each row shows the request count for the current window. Click a row to expand input / output / cache-read / cache-write token detail
- **Window switching**: click the `[5h]` / `[Wk]` / `[Mo]` header to change the aggregation window
- **Focused models**: `/go-settings` → "Focused models" to filter by specific models
- **Commands**: `/go-lang` switches UI language (中文 / English), `/go-settings` opens settings
- **Bilingual**: auto-detects system language, switch any time

## Install

Install from GitHub (no npm publish needed):

```bash
git clone https://github.com/zy637675/opencode-go-usage-tui.git
cd opencode-go-usage-tui
npm install
npm run build
```

Point your OpenCode plugin search path at this directory (via `config.pluginPaths` in `opencode.json`) and restart. `dist/tui.js` is committed, so you can use the built artifact directly without building locally.

## Configuration

Config file `~/.config/opencode/go-usage-config.json` (optional, defaults shown):

```json
{
  "ui": { "price_panel": true },
  "focus_models": []
}
```

- `ui.price_panel`: show the usage panel (default `true`)
- `focus_models`: model IDs to focus on (empty = show all; managed via `/go-settings`)

## Development

```bash
npm run build      # esbuild bundle to dist/tui.js
npx tsc --noEmit   # type check
```

## Changelog

See [CHANGELOG_EN.md](./CHANGELOG_EN.md).

## License

[MIT](./LICENSE) © zy637675