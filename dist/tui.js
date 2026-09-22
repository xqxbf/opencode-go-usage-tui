// src/index.tsx
import { createComponent as _$createComponent2 } from "@opentui/solid";
import { Plugin, PluginContextProvider } from "@opencode/plugin/tui";

// src/state.ts
import { createSignal } from "solid-js";

// src/i18n.ts
var ZH_T = {
  langTitle: "\u663E\u793A\u8BED\u8A00",
  langCmdTitle: "\u7528\u91CF\u7EDF\u8BA1: \u8BED\u8A00",
  langCmdDesc: "\u5207\u6362\u663E\u793A\u8BED\u8A00 | Switch display language",
  langSwitchedZh: "\u5DF2\u5207\u6362\u4E3A\u4E2D\u6587",
  langSwitchedEn: "Switched to English",
  // ── 用量统计面板 ──
  usageTitle: "\u7528\u91CF\u7EDF\u8BA1",
  usageModel: "\u6A21\u578B",
  usageLoading: "\u52A0\u8F7D\u4E2D...",
  usageWin5h: "5h",
  usageWinWeek: "\u5468",
  usageWinMonth: "\u6708",
  usageReqs: "\u8BF7\u6C42",
  usageInput: "\u8F93\u5165",
  usageOutput: "\u8F93\u51FA",
  usageCacheRead: "\u7F13\u5B58\u8BFB",
  usageCacheWrite: "\u7F13\u5B58\u5199",
  usageNone: "\u6682\u65E0\u7528\u91CF\u8BB0\u5F55",
  usageUpdated: "\u7528\u91CF\u66F4\u65B0",
  usageLoadError: "\u7528\u91CF\u67E5\u8BE2\u5931\u8D25",
  // ── 设置 / 关注模型 ──
  settingsTitle: "\u7528\u91CF\u7EDF\u8BA1\u8BBE\u7F6E",
  settingsDesc: "\u8BBE\u7F6E\u663E\u793A\u8BED\u8A00\u4E0E\u5173\u6CE8\u7684\u6A21\u578B",
  settingsFocus: "\u5173\u6CE8\u7684\u6A21\u578B",
  settingsSaved: "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58",
  focusAllTitle: "\u5168\u90E8\u663E\u793A\uFF08\u5DF2\u9009 {n}\uFF09",
  focusNone: "\u6E05\u7A7A\u9009\u62E9",
  focusDone: "\u5B8C\u6210",
  focusSelected: "\u5DF2\u9009 {n}",
  countUnit: "\u4E2A"
};
var EN_T = {
  langTitle: "Display language",
  langCmdTitle: "Usage Stats: Language",
  langCmdDesc: "\u5207\u6362\u663E\u793A\u8BED\u8A00 | Switch display language",
  langSwitchedZh: "\u5DF2\u5207\u6362\u4E3A\u4E2D\u6587",
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
  countUnit: "selected"
};
var LANGS = { zh: ZH_T, en: EN_T };
var LANG_META = [
  { code: "zh", label: "\u4E2D\u6587" },
  { code: "en", label: "English" }
];
function applyParams(tpl, params) {
  if (!params) return tpl;
  return tpl.replace(
    /\{(\w+)\}/g,
    (m, k) => k in params ? String(params[k]) : m
  );
}
function createT(getCode) {
  return (key, params) => applyParams(LANGS[getCode()][key], params);
}
function detectLang() {
  try {
    if (Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith("zh")) return "zh";
    return "en";
  } catch {
    return "en";
  }
}

// src/state.ts
var [configTick, setConfigTick] = createSignal(0);
var [langCode, setLangCode] = createSignal(detectLang());
var t = createT(() => langCode());
var [usageWindow, setUsageWindow] = createSignal("5h");
var _usagePollOwner = null;
function claimUsagePoll(token) {
  if (_usagePollOwner) return false;
  _usagePollOwner = token;
  return true;
}
function releaseUsagePoll(token) {
  if (_usagePollOwner === token) _usagePollOwner = null;
}
var SIDEBAR_MIN_COLS = 90;
var [termCols, setTermCols] = createSignal(
  typeof process !== "undefined" && process.stdout?.columns || 100
);
try {
  ;
  process.stdout.on("resize", () => {
    const c = process.stdout?.columns | 0;
    if (c > 0) setTermCols(c);
  });
} catch {
}

// src/helpers.ts
function visualWidth(s) {
  let w = 0;
  for (const c of s) {
    const code = c.codePointAt(0) ?? 0;
    w += code >= 4352 && code <= 4447 || code >= 11904 && code <= 42191 || code >= 44032 && code <= 55203 || code >= 63744 && code <= 64255 || code >= 65281 && code <= 65376 || code >= 65504 && code <= 65510 ? 2 : 1;
  }
  return w;
}
var FALLBACK = {
  primary: "#8B9DAF",
  text: "#C5C5BB",
  muted: "#7A7A72",
  success: "#9CAF8B",
  warning: "#C5B88D",
  error: "#B08A8A",
  border: "#6B6B63"
};
function hex(raw) {
  if (typeof raw === "string" && raw.startsWith("#") && raw.length >= 7) return raw;
  if (raw && typeof raw === "object" && typeof raw.r === "number") {
    const r = Math.round(raw.r * 255), g = Math.round(raw.g * 255), b = Math.round(raw.b * 255);
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  return "";
}
var prefsHandle = null;
function prefsStore(context) {
  return prefsHandle ??= context.storage.store("go-usage", { initial: { lang: null, onboarded: false } });
}
function toastTry(context, opts) {
  try {
    context.ui.toast.show(opts);
  } catch {
  }
}

// src/panels/PricePanel.tsx
import { createComponent as _$createComponent } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { use as _$use } from "@opentui/solid";
import { memo as _$memo } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { createSignal as createSignal3, createEffect as createEffect2, onMount, onCleanup as onCleanup2, Show } from "solid-js";
import { usePlugin } from "@opencode/plugin/tui";

// src/config.ts
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
var CONFIG_DIR = process?.env?.OPENCODE_CONFIG_DIR || (process?.env?.USERPROFILE ? `${process.env.USERPROFILE}\\.config\\opencode` : "") || process?.env?.HOME + "/.config/opencode";
var CONFIG_FILE = join(CONFIG_DIR, "go-usage-config.json");
function readJsonFile(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}
function loadConfig() {
  const fileCfg = readJsonFile(CONFIG_FILE) ?? {};
  return {
    pricePanel: fileCfg.ui?.price_panel ?? true,
    focusModels: fileCfg.focus_models ?? []
  };
}
function saveConfig(patch) {
  const fileCfg = readJsonFile(CONFIG_FILE) ?? {};
  if (patch.ui !== void 0) fileCfg.ui = { ...fileCfg.ui ?? {}, ...patch.ui };
  if (patch.focus_models !== void 0) fileCfg.focus_models = patch.focus_models;
  try {
    mkdirSync(dirname(CONFIG_FILE), { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(fileCfg, null, 2), "utf8");
  } catch {
  }
}

// src/pricing.ts
function buildLocalRows(registry) {
  return registry.map((m) => ({
    id: m.modelID || m.id,
    providerID: m.providerID,
    name: (m.name || m.modelID || m.id).trim()
  }));
}

// src/usage.ts
var WINDOW_KEYS = ["5h", "week", "month"];
function windowStart(key, now) {
  const d = new Date(now);
  if (key === "5h") return now - 5 * 36e5;
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (key === "week") return dayStart - (d.getDay() === 0 ? 6 : d.getDay() - 1) * 864e5;
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
function emptyTotals() {
  return { requests: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
}
function aggregateUsage(messages, now) {
  const starts = {
    "5h": windowStart("5h", now),
    week: windowStart("week", now),
    month: windowStart("month", now)
  };
  const map = /* @__PURE__ */ new Map();
  for (const m of messages) {
    if (m.type !== "assistant" || !m.tokens || !m.model) continue;
    const created = m.time?.created ?? 0;
    if (!created) continue;
    const modelID = m.model.id.split("/").pop() || m.model.id;
    let by = map.get(modelID);
    if (!by) {
      by = {};
      map.set(modelID, by);
    }
    for (const key of WINDOW_KEYS) {
      if (created < starts[key]) continue;
      const t2 = by[key] ?? emptyTotals();
      t2.requests++;
      t2.input += m.tokens.input;
      t2.output += m.tokens.output;
      t2.cacheRead += m.tokens.cache?.read ?? 0;
      t2.cacheWrite += m.tokens.cache?.write ?? 0;
      by[key] = t2;
    }
  }
  return map;
}

// src/hooks.ts
import { createSignal as createSignal2, createEffect, onCleanup } from "solid-js";
function useThemeColors(theme) {
  const [pal, setPal] = createSignal2({ ...FALLBACK });
  createEffect(() => {
    const th = theme;
    const src = {
      text: th?.text?.base,
      muted: th?.text?.muted,
      primary: th?.text?.action?.primary?.base,
      success: th?.text?.feedback?.success?.base,
      warning: th?.text?.feedback?.warning?.base,
      error: th?.text?.feedback?.error?.base,
      border: th?.border?.base
    };
    const p = { ...FALLBACK };
    for (const k of Object.keys(FALLBACK)) {
      const h = hex(src[k]);
      if (h) p[k] = h;
    }
    setPal(p);
  });
  return () => pal();
}
function usePanelBox(onWidthChange) {
  const [panelWidth, setPanelWidth] = createSignal2(24);
  let boxEl;
  let resizeTimeout = null;
  const boxRef = (el) => {
    boxEl = el;
  };
  const onSizeChange = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (!boxEl) return;
      const w = Math.max(20, boxEl.width ?? 24);
      if (w !== panelWidth()) {
        setPanelWidth(w);
        onWidthChange?.();
      }
    }, 100);
  };
  const syncPanelWidth = () => {
    if (!boxEl) return false;
    const w = Math.max(20, boxEl.width ?? 24);
    if (w !== panelWidth()) {
      setPanelWidth(w);
      onWidthChange?.();
    }
    return boxEl.width > 0;
  };
  onCleanup(() => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
      resizeTimeout = null;
    }
  });
  return { boxRef, panelWidth, onSizeChange, syncPanelWidth };
}

// src/panels/PricePanel.tsx
function PricePanel() {
  const context = usePlugin();
  const [open, setOpen] = createSignal3(true);
  const [localRows, setLocalRows] = createSignal3([]);
  const [usageMap, setUsageMap] = createSignal3(/* @__PURE__ */ new Map());
  const [pageError, setPageError] = createSignal3("");
  const [renderTick, setRenderTick] = createSignal3(0);
  const [listReady, setListReady] = createSignal3(false);
  const [expandedId, setExpandedId] = createSignal3(null);
  const [updated, setUpdated] = createSignal3(0);
  const [cfg, setCfg] = createSignal3(loadConfig());
  createEffect2(() => {
    void configTick();
    setCfg(loadConfig());
  });
  const {
    boxRef,
    panelWidth,
    onSizeChange,
    syncPanelWidth
  } = usePanelBox(() => setRenderTick((v) => v + 1));
  const colors = useThemeColors(context.theme);
  createEffect2(() => {
    const rows = localRows();
    if (rows.length > 0) {
      const id = setTimeout(() => setListReady(true), 150);
      onCleanup2(() => clearTimeout(id));
    } else {
      setListReady(false);
    }
  });
  createEffect2(() => {
    if (!(listReady() && localRows().length > 0)) return;
    const t1 = setTimeout(() => setRenderTick((v) => v + 1), 250);
    const t2 = setTimeout(() => setRenderTick((v) => v + 1), 600);
    const t3 = setTimeout(() => setRenderTick((v) => v + 1), 1e3);
    onCleanup2(() => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    });
  });
  async function scanUsage(forceSync) {
    try {
      const sessions = context.data.session.list() ?? [];
      if (forceSync && sessions.length > 0) {
        for (let i = 0; i < sessions.length; i += 5) {
          await Promise.all(sessions.slice(i, i + 5).map((s) => context.data.session.message.sync(s.id)));
        }
      }
      const msgs = [];
      for (const s of sessions) {
        const list = context.data.session.message.list(s.id);
        if (list) msgs.push(...list);
      }
      setUsageMap(aggregateUsage(msgs, Date.now()));
      setUpdated(Date.now());
      setPageError("");
    } catch {
      setPageError(t("usageLoadError"));
    }
  }
  let widthSyncTimer = null;
  let scanTimer = null;
  let scanRunning = false;
  const pollToken = {};
  const isOwner = claimUsagePoll(pollToken);
  onMount(() => {
    let tries = 0;
    const syncWidth = () => {
      tries++;
      if (syncPanelWidth()) {
        setRenderTick((v) => v + 1);
        widthSyncTimer = setTimeout(() => setRenderTick((v) => v + 1), 150);
        return;
      }
      if (tries < 50) widthSyncTimer = setTimeout(syncWidth, 80);
    };
    widthSyncTimer = setTimeout(syncWidth, 30);
    const loadReg = async () => {
      try {
        await context.data.location.model.sync();
        const reg = context.data.location.model.list() ?? [];
        setLocalRows(buildLocalRows(reg.map((m) => ({
          id: m.id,
          providerID: m.providerID,
          modelID: m.modelID,
          name: m.name
        }))));
      } catch {
        setLocalRows([]);
      }
    };
    void loadReg();
    if (isOwner) {
      const runScan = async (force) => {
        if (scanRunning) return;
        scanRunning = true;
        try {
          await scanUsage(force);
        } finally {
          scanRunning = false;
        }
      };
      void runScan(true);
      scanTimer = setInterval(() => {
        void runScan(false);
      }, 6e4);
    }
    onCleanup2(() => {
      if (widthSyncTimer) clearTimeout(widthSyncTimer);
      if (scanTimer) clearInterval(scanTimer);
      if (isOwner) releaseUsagePoll(pollToken);
    });
  });
  const cycleWindow = () => {
    const next = {
      "5h": "week",
      week: "month",
      month: "5h"
    };
    setUsageWindow(next[usageWindow()]);
  };
  const winLabel = (w) => w === "5h" ? t("usageWin5h") : w === "week" ? t("usageWinWeek") : t("usageWinMonth");
  function fmtWindow(n) {
    if (n == null) return "-";
    if (n >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 !== 0 ? 1 : 0)}M`;
    if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
    return String(n);
  }
  function visualPadEnd(s, w) {
    const cur = visualWidth(s);
    if (cur >= w) return s;
    return s + " ".repeat(w - cur);
  }
  function abbreviateName(name, maxLen) {
    if (visualWidth(name) <= maxLen) return name;
    let out = "";
    let w = 0;
    for (const c of name) {
      const cw = visualWidth(c);
      if (w + cw > maxLen - 1) break;
      out += c;
      w += cw;
    }
    return out + "\u2026";
  }
  function justify(label, value) {
    void renderTick();
    const outer = panelWidth();
    const gauge = Math.max(10, outer - 4);
    const used = visualWidth(label) + visualWidth(value);
    return label + " ".repeat(Math.max(1, gauge - used)) + value;
  }
  function renderRow(row) {
    const totals = usageMap().get(row.id)?.[usageWindow()];
    const expanded = expandedId() === row.id;
    const name = abbreviateName(row.name, 18);
    const req = totals ? `${totals.requests}` : "\u2014";
    const ind = expanded ? " \u25BE" : " \u25B8";
    const fg = totals ? colors().text : colors().muted;
    const rowEl = (() => {
      var _el$ = _$createElement("text");
      _$setProp(_el$, "fg", fg);
      _$setProp(_el$, "selectable", false);
      _$setProp(_el$, "onMouseUp", (e) => {
        e.preventDefault();
        setExpandedId(expanded ? null : row.id);
      });
      _$insert(_el$, () => justify(name, req + ind));
      return _el$;
    })();
    if (!expanded) return rowEl;
    if (!totals) {
      return [rowEl, (() => {
        var _el$2 = _$createElement("text");
        _$setProp(_el$2, "selectable", false);
        _$insert(_el$2, () => `  \u2514 ${t("usageNone")}`);
        _$effect((_$p) => _$setProp(_el$2, "fg", colors().muted, _$p));
        return _el$2;
      })()];
    }
    const items = [[t("usageReqs"), String(totals.requests)], [t("usageInput"), fmtWindow(totals.input)], [t("usageOutput"), fmtWindow(totals.output)], [t("usageCacheRead"), fmtWindow(totals.cacheRead)], [t("usageCacheWrite"), fmtWindow(totals.cacheWrite)]];
    return [rowEl, _$memo(() => items.map(([label, val], i) => {
      const conn = i < items.length - 1 ? "\u251C" : "\u2514";
      return (() => {
        var _el$3 = _$createElement("text");
        _$setProp(_el$3, "selectable", false);
        _$insert(_el$3, () => visualPadEnd(`  ${conn} ${label}:`, 8) + val);
        _$effect((_$p) => _$setProp(_el$3, "fg", colors().muted, _$p));
        return _el$3;
      })();
    }))];
  }
  const sep = () => {
    void renderTick();
    const outer = panelWidth();
    return "\u2500".repeat(Math.max(1, outer - 4));
  };
  return _$createComponent(Show, {
    get when() {
      return termCols() >= SIDEBAR_MIN_COLS;
    },
    get children() {
      var _el$4 = _$createElement("box"), _el$5 = _$createElement("text"), _el$6 = _$createElement("span"), _el$7 = _$createElement("span"), _el$8 = _$createElement("b"), _el$10 = _$createElement("span");
      _$insertNode(_el$4, _el$5);
      _$use(boxRef, _el$4);
      _$setProp(_el$4, "border", true);
      _$setProp(_el$4, "paddingLeft", 1);
      _$setProp(_el$4, "paddingRight", 1);
      _$setProp(_el$4, "flexDirection", "column");
      _$setProp(_el$4, "gap", 0);
      _$setProp(_el$4, "onSizeChange", onSizeChange);
      _$insertNode(_el$5, _el$6);
      _$insertNode(_el$5, _el$7);
      _$insertNode(_el$5, _el$10);
      _$setProp(_el$5, "selectable", false);
      _$setProp(_el$5, "onMouseUp", () => setOpen((o) => !o));
      _$insert(_el$6, () => open() ? "\u25BC " : "\u25B6 ");
      _$insertNode(_el$7, _el$8);
      _$insert(_el$8, () => t("usageTitle"));
      _$insert(_el$5, _$createComponent(Show, {
        get when() {
          return localRows().length > 0;
        },
        get children() {
          var _el$9 = _$createElement("span"), _el$0 = _$createTextNode(` (`), _el$1 = _$createTextNode(`)`);
          _$insertNode(_el$9, _el$0);
          _$insertNode(_el$9, _el$1);
          _$insert(_el$9, () => localRows().length, _el$1);
          _$effect((_$p) => _$setProp(_el$9, "style", {
            fg: colors().muted
          }, _$p));
          return _el$9;
        }
      }), _el$10);
      _$insert(_el$10, () => sep().slice(visualWidth((open() ? "\u25BC " : "\u25B6 ") + t("usageTitle") + (localRows().length > 0 ? ` (${localRows().length})` : ""))));
      _$insert(_el$4, _$createComponent(Show, {
        get when() {
          return open();
        },
        get children() {
          return [(() => {
            var _el$11 = _$createElement("text");
            _$setProp(_el$11, "selectable", false);
            _$setProp(_el$11, "onMouseUp", (e) => {
              e.preventDefault();
              cycleWindow();
            });
            _$insert(_el$11, () => justify(t("usageModel"), `${t("usageReqs")} [${winLabel(usageWindow())}]`));
            _$effect((_$p) => _$setProp(_el$11, "fg", colors().warning, _$p));
            return _el$11;
          })(), (() => {
            var _el$12 = _$createElement("text");
            _$setProp(_el$12, "selectable", false);
            _$insert(_el$12, sep);
            _$effect((_$p) => _$setProp(_el$12, "fg", colors().muted, _$p));
            return _el$12;
          })(), _$createComponent(Show, {
            get when() {
              return localRows().length > 0;
            },
            get fallback() {
              return (() => {
                var _el$15 = _$createElement("text");
                _$setProp(_el$15, "selectable", false);
                _$insert(_el$15, () => t("usageLoading"));
                _$effect((_$p) => _$setProp(_el$15, "fg", colors().muted, _$p));
                return _el$15;
              })();
            },
            get children() {
              return [_$memo(() => _$memo(() => !!listReady())() ? localRows().filter((row) => cfg().focusModels.length === 0 || cfg().focusModels.includes(row.id)).map((row) => renderRow(row)) : null), _$createComponent(Show, {
                get when() {
                  return pageError();
                },
                get children() {
                  var _el$13 = _$createElement("text");
                  _$setProp(_el$13, "selectable", false);
                  _$insert(_el$13, pageError);
                  _$effect((_$p) => _$setProp(_el$13, "fg", colors().error, _$p));
                  return _el$13;
                }
              }), (() => {
                var _el$14 = _$createElement("text");
                _$setProp(_el$14, "selectable", false);
                _$insert(_el$14, () => justify(t("usageUpdated"), updated() ? new Date(updated()).toLocaleTimeString() : "-"));
                _$effect((_$p) => _$setProp(_el$14, "fg", colors().muted, _$p));
                return _el$14;
              })()];
            }
          })];
        }
      }), null);
      _$effect((_p$) => {
        var _v$ = colors().border, _v$2 = {
          fg: colors().muted
        }, _v$3 = {
          fg: colors().primary
        }, _v$4 = {
          fg: colors().muted
        };
        _v$ !== _p$.e && (_p$.e = _$setProp(_el$4, "borderColor", _v$, _p$.e));
        _v$2 !== _p$.t && (_p$.t = _$setProp(_el$6, "style", _v$2, _p$.t));
        _v$3 !== _p$.a && (_p$.a = _$setProp(_el$7, "style", _v$3, _p$.a));
        _v$4 !== _p$.o && (_p$.o = _$setProp(_el$10, "style", _v$4, _p$.o));
        return _p$;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0
      });
      return _el$4;
    }
  });
}

// src/ui/dialogs.tsx
async function runLangDialog(context) {
  const code = await context.ui.dialog.select({
    title: t("langTitle"),
    options: LANG_META.map((m) => ({
      title: `${m.label}${langCode() === m.code ? " \u2713" : ""}`,
      value: m.code
    }))
  });
  if (!code) return;
  setLangCode(code);
  const [, setPrefs] = prefsStore(context);
  await setPrefs((d) => {
    d.lang = code;
  });
  toastTry(context, {
    message: code === "zh" ? t("langSwitchedZh") : t("langSwitchedEn")
  });
}
async function runSettingsDialog(context) {
  await settingsMenu(context);
}
async function settingsMenu(context) {
  const cfg = loadConfig();
  const opt = await context.ui.dialog.select({
    title: t("settingsTitle"),
    options: [{
      title: `${t("settingsFocus")} (${cfg.focusModels.length} ${t("countUnit")})`,
      value: "focus-models"
    }]
  });
  if (!opt) return;
  if (opt === "focus-models") {
    await focusLoop(context);
    await settingsMenu(context);
  }
}
async function focusLoop(context) {
  let lastSelected;
  let rows = [];
  try {
    await context.data.location.model.sync();
    rows = buildLocalRows(context.data.location.model.list() ?? []);
  } catch {
  }
  while (true) {
    const cur = loadConfig().focusModels;
    const modelOptions = rows.map((r) => ({
      title: `${cur.includes(r.id) ? "\u2611" : "\u2610"} ${r.name}`,
      value: r.id
    }));
    const focusOptions = [...modelOptions, {
      title: `${t("focusAllTitle", {
        n: cur.length
      })}`,
      value: "select-all"
    }, {
      title: t("focusNone"),
      value: "clear-all"
    }, {
      title: `${t("focusDone")} (${t("focusSelected", {
        n: cur.length
      })})`,
      value: "done"
    }];
    const opt = await context.ui.dialog.select({
      title: t("settingsFocus"),
      current: lastSelected,
      options: focusOptions
    });
    if (!opt) return;
    if (opt === "done") return;
    if (opt === "select-all") {
      saveConfig({
        focus_models: rows.map((r) => r.id)
      });
    } else if (opt === "clear-all") {
      saveConfig({
        focus_models: []
      });
    } else {
      const next = cur.includes(opt) ? cur.filter((id) => id !== opt) : [...cur, opt];
      saveConfig({
        focus_models: next
      });
    }
    lastSelected = opt;
    setConfigTick((v) => v + 1);
    toastTry(context, {
      variant: "success",
      message: t("settingsSaved")
    });
  }
}

// src/index.tsx
var index_default = Plugin.define({
  id: "opencode-go-usage-tui",
  setup(context) {
    context.ui.slot({
      append: "sidebar.content",
      render: () => _$createComponent2(PluginContextProvider, {
        value: context,
        get children() {
          return _$createComponent2(PricePanel, {});
        }
      })
    });
    context.ui.slot({
      append: "app",
      render: () => {
        context.keymap.layer(() => ({
          mode: "global",
          commands: [{
            id: "go-usage.lang",
            title: t("langCmdTitle"),
            description: t("langCmdDesc"),
            group: "Go Usage",
            palette: true,
            slash: {
              name: "go-lang"
            },
            run: async () => {
              await runLangDialog(context);
            }
          }, {
            id: "go-usage.settings",
            title: t("settingsTitle"),
            description: t("settingsDesc"),
            group: "Go Usage",
            palette: true,
            slash: {
              name: "go-settings"
            },
            run: async () => {
              await runSettingsDialog(context);
            }
          }]
        }));
        return null;
      }
    });
    const [prefs, setPrefs] = prefsStore(context);
    const saved = prefs.lang;
    if (saved === "zh" || saved === "en") setLangCode(saved);
    else setLangCode(detectLang());
    let onboarding;
    if (!prefs.onboarded) {
      void setPrefs((d) => {
        d.onboarded = true;
      });
      onboarding = setTimeout(() => {
        void runLangDialog(context);
      }, 1500);
    }
    return () => {
      if (onboarding) clearTimeout(onboarding);
    };
  }
});
export {
  index_default as default
};
