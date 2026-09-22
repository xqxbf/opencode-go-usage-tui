import * as esbuild from "esbuild"
import { solidPlugin } from "esbuild-plugin-solid"
import { readFileSync } from "node:fs"

const pkg = JSON.parse(readFileSync("package.json", "utf8"))

await esbuild.build({
  entryPoints: ["src/index.tsx"],
  outfile: "dist/tui.js",
  format: "esm",
  platform: "node",
  bundle: true,
  external: ["@opencode/plugin", "@opencode/plugin/*", "@opencode/theme", "@opencode/theme/*", "@opentui/*", "solid-js", "node:fs", "node:path", "node:crypto"],
  plugins: [solidPlugin({ solid: { moduleName: "@opentui/solid", generate: "universal" } })],
  define: { __PLUGIN_VERSION__: JSON.stringify(pkg.version) },
  logLevel: "info",
})