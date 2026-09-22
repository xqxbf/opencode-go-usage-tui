import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"

declare const process: { env: Record<string, string | undefined> } | undefined

const CONFIG_DIR = process?.env?.OPENCODE_CONFIG_DIR
  || (process?.env?.USERPROFILE ? `${process.env.USERPROFILE}\\.config\\opencode` : "")
  || process?.env?.HOME + "/.config/opencode"
const CONFIG_FILE = join(CONFIG_DIR, "go-usage-config.json")

function readJsonFile<T>(file: string): T | null {
  try { return JSON.parse(readFileSync(file, "utf8")) as T } catch { return null }
}

interface ConfigFile {
  ui?: { price_panel?: boolean }
  focus_models?: string[]
}

export interface LoadedConfig {
  pricePanel: boolean
  focusModels: string[]
}

export function loadConfig(): LoadedConfig {
  const fileCfg = readJsonFile<ConfigFile>(CONFIG_FILE) ?? {}
  return {
    pricePanel: fileCfg.ui?.price_panel ?? true,
    focusModels: fileCfg.focus_models ?? [],
  }
}

export function saveConfig(patch: {
  ui?: { price_panel?: boolean }
  focus_models?: string[]
}): void {
  const fileCfg = readJsonFile<ConfigFile>(CONFIG_FILE) ?? {}
  if (patch.ui !== undefined) fileCfg.ui = { ...(fileCfg.ui ?? {}), ...patch.ui }
  if (patch.focus_models !== undefined) fileCfg.focus_models = patch.focus_models
  try {
    mkdirSync(dirname(CONFIG_FILE), { recursive: true })
    writeFileSync(CONFIG_FILE, JSON.stringify(fileCfg, null, 2), "utf8")
  } catch { /* 写入失败忽略 */ }
}