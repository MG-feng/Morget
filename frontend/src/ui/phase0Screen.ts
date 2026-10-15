import { el, formatBytes, showToast, showConfirm } from "./components";
import { lang, setLocale } from "../lang/lang";
import { cmd, isDesktop, asApiError, errorText } from "../bridge/backendApi";
import type { DataPaths, StorageEntry, SystemInfo } from "../bridge/backendApi";
import { getConfig, updateConfig } from "../config/configStore";
import { applyTheme } from "./theme";
import { open as dialogOpen } from "@tauri-apps/plugin-dialog";

let ackSuppressed = false;

export function isAckSuppressed(): boolean {
  return ackSuppressed;
}

export function setAckSuppressed(v: boolean): void {
  ackSuppressed = v;
}

let logLines: string[] = [];
let pollTimer: ReturnType<typeof setInterval> | undefined;

export function log(msg: string): void {
  const ts = new Date().toLocaleTimeString();
  logLines.push(`[${ts}] ${msg}`);

  if (logLines.length > 300) logLines.shift();

  const box = document.getElementById("p0log");
  if (box) box.textContent = logLines.join("\n");
}

function section(title: string, body: HTMLElement): HTMLElement {
  const s = el("div", { className: "p0Section" });
  s.append(el("h2", { className: "p0SectionTitle", text: title }));
  s.append(body);
  return s;
}

function kv(k: string, v: string): HTMLElement {
  const row = el("div", { className: "p0Kv" });
  row.append(el("span", { className: "p0K", text: k }));
  row.append(el("span", { className: "p0V mono", text: v }));
  return row;
}

function row(...children: HTMLElement[]): HTMLElement {
  return el("div", { className: "p0Row" }, children);
}

function btn(label: string, onClick: () => void, danger = false): HTMLButtonElement {
  const b = el("button", {
    className: danger ? "btn btnDanger" : "btn",
    text: label,
  });

  b.addEventListener("click", () => {
    try {
      onClick();
    } catch (e) {
      log(`ERROR ${String(e)}`);
    }
  });

  return b;
}

async function guard<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  if (!isDesktop) {
    showToast(lang("error.platformUnsupported"), "warn");
    log(`${label}: ${lang("error.platformUnsupported")}`);
    return null;
  }

  try {
    const v = await fn();
    log(`${label}: OK`);
    return v;
  } catch (e) {
    const err = asApiError(e);
    log(`${label}: [${err.code}] ${errorText(e)}`);
    showToast(lang("toast.error", { message: errorText(e) }), "error");
    return null;
  }
}

export function renderPhase0Screen(root: HTMLElement): void {
  if (pollTimer) clearInterval(pollTimer);

  root.innerHTML = "";

  const wrap = el("div", { className: "p0Wrap" });

  wrap.append(
    el("h1", { className: "p0Title", text: lang("p0.title") }),
    el("div", {
      className: "p0Env",
      text: isDesktop ? lang("p0.env.desktop") : lang("p0.env.web"),
    })
  );

  // System info
  const sysBody = el("div", { className: "p0Body" });
  const sysInfo = el("div", { className: "p0Body" });

  sysBody.append(
    row(
      btn(lang("p0.system.fetch"), () => {
        void guard<SystemInfo>("getSystemInfo", () => cmd.getSystemInfo()).then((si) => {
          if (!si) return;

          sysInfo.innerHTML = "";
          sysInfo.append(
            kv("os", si.os),
            kv("logicalCpuThreads", String(si.logicalCpuThreads)),
            kv("physicalCores", String(si.physicalCores)),
            kv("totalRamMib", String(si.totalRamMib)),
            kv("gpus", si.gpus.join(" | ") || "-"),
            kv("elevated", String(si.elevated))
          );
        });
      })
    ),
    sysInfo
  );

  wrap.append(section(lang("p0.section.system"), sysBody));

  // Config
  const cfgBody = el("div", { className: "p0Body" });
  const cfgView = el("div", { className: "p0Body" });
  const pathsView = el("div", { className: "p0Body" });

  const paintCfg = (): void => {
    const c = getConfig();

    cfgView.innerHTML = "";
    cfgView.append(
      kv("general.language", c.general.language),
      kv("general.fps", String(c.general.fps)),
      kv("graphics.windowMode", c.graphics.windowMode),
      kv("graphics.fancyGraphics", String(c.graphics.fancyGraphics)),
      kv("style.theme", c.style.theme),
      kv("advanced.adminPrivilege", String(c.advanced.adminPrivilege)),
      kv("advanced.closeBehavior", c.advanced.closeBehavior),
      kv("advanced.closeDontAsk", String(c.advanced.closeDontAsk)),
      kv("hotkeys.fullscreen", c.hotkeys.fullscreen),
      kv("hotkeys.restart", c.hotkeys.restart),
      kv("hotkeys.close", c.hotkeys.close),
      kv("services.marketApiUrl", c.services.marketApiUrl || "(empty)")
    );
  };

  paintCfg();

  cfgBody.append(
    row(
      btn(lang("p0.config.reload"), () => {
        void guard<DataPaths>("getDataPaths", () => cmd.getDataPaths()).then((p) => {
          if (!p) return;

          pathsView.innerHTML = "";
          pathsView.append(
            kv("baseDir", p.baseDir),
            kv("pluginsDir", p.pluginsDir),
            kv("packagesDir", p.packagesDir),
            kv("cacheDir", p.cacheDir)
          );
        });
      }),
      btn(lang("p0.config.fancy"), () => {
        updateConfig((c) => {
          c.graphics.fancyGraphics = !c.graphics.fancyGraphics;
        });

        applyTheme(getConfig());
        renderPhase0Screen(root);
      })
    ),
    cfgView,
    pathsView
  );

  wrap.append(section(lang("p0.section.config"), cfgBody));

  // Window mode
  const winBody = el("div", { className: "p0Body" });

  const setMode = (mode: string): void => {
    const c = getConfig();

    updateConfig((cfg) => {
      cfg.graphics.windowMode = mode;
    });

    void guard(`applyWindowMode(${mode})`, () =>
      cmd.applyWindowMode(mode, c.graphics.windowWidth, c.graphics.windowHeight)
    ).then(() => renderPhase0Screen(root));
  };

  winBody.append(
    row(
      btn(lang("p0.window.windowed"), () => setMode("windowed")),
      btn(lang("p0.window.fullscreen"), () => setMode("fullscreen")),
      btn(lang("p0.window.borderless"), () => setMode("borderless"))
    )
  );

  wrap.append(section(lang("p0.section.window"), winBody));

  // Close / watchdog
  const closeBody = el("div", { className: "p0Body" });
  const closeState = el("div", { className: "p0Body" });
  const suppressLabel = el("span", { className: "p0V" });

  const paintClose = (): void => {
    suppressLabel.textContent = `${lang("p0.close.suppressAck")}: ${String(ackSuppressed)}`;
  };

  paintClose();

  const refreshCloseState = (): void => {
    if (!isDesktop) return;

    cmd
      .getCloseState()
      .then((s) => {
        closeState.innerHTML = "";
        closeState.append(
          kv("closeGen", String(s.gen)),
          kv("closeAcked", String(s.acked))
        );
      })
      .catch(() => undefined);
  };

  closeBody.append(
    row(
      btn(lang("p0.close.trigger"), () => {
        void guard("requestClose", () => cmd.requestClose());
      }),
      btn(lang("p0.close.toggleSuppress"), () => {
        setAckSuppressed(!ackSuppressed);
        paintClose();
        log(`ackSuppressed = ${String(ackSuppressed)}`);
      }),
      btn(lang("p0.close.refreshState"), refreshCloseState)
    ),
    row(suppressLabel),
    closeState
  );

  wrap.append(section(lang("p0.section.close"), closeBody));

  // Storage
  const stBody = el("div", { className: "p0Body" });
  const stView = el("div", { className: "p0Body" });

  const refreshStorage = (): void => {
    void guard<StorageEntry[]>("getStorageUsage", () => cmd.getStorageUsage()).then((entries) => {
      if (!entries) return;

      stView.innerHTML = "";

      for (const e of entries) {
        stView.append(
          kv(
            e.id,
            `${e.exists ? formatBytes(e.sizeBytes) : "-"}  (${e.path})`
          )
        );
      }
    });
  };

  const deleteTarget = (id: string, confirmKey: string, successKey: string): void => {
    void (async () => {
      const ok = await showConfirm("p0.confirm.title", confirmKey, true);
      if (!ok) return;

      const token = await guard(`getDeleteToken(${id})`, () => cmd.getDeleteToken(id));
      if (!token) return;

      await guard(`deleteStorage(${id})`, () => cmd.deleteStorage(id, token));
      showToast(lang(successKey));
      renderPhase0Screen(root);
    })();
  };

  stBody.append(
    row(
      btn(lang("p0.storage.refresh"), refreshStorage),
      btn(lang("p0.storage.deleteCache"), () =>
        deleteTarget("cache", "p0.storage.confirmDelete", "toast.cacheCleared")
      ),
      btn(lang("p0.storage.factoryReset"), () =>
        deleteTarget("factory", "p0.storage.confirmFactoryReset", "toast.deleted")
      )
    ),
    stView
  );

  wrap.append(section(lang("p0.section.storage"), stBody));

  // Export
  const exBody = el("div", { className: "p0Body" });

  const doExport = (kind: "settings" | "data"): void => {
    const fileName = kind === "settings" ? "morget-settings.json" : "morget-data.json";

    void guard(`exportToFile(${kind})`, () => cmd.exportToFile(fileName, kind)).then((p) => {
      if (p) showToast(`${lang("toast.exported")}: ${p}`);
    });
  };

  exBody.append(
    row(
      btn(lang("p0.export.settings"), () => doExport("settings")),
      btn(lang("p0.export.data"), () => doExport("data")),
      btn(lang("p0.export.openDir"), () => {
        void guard("getDataPaths", () => cmd.getDataPaths()).then((p) => {
          if (p) void guard("openFolder", () => cmd.openFolder(p.baseDir));
        });
      })
    )
  );

  wrap.append(section(lang("p0.section.export"), exBody));

  // UAC
  const uacBody = el("div", { className: "p0Body" });

  uacBody.append(
    row(
      btn(lang("p0.uac.request"), () => {
        showToast(lang("toast.adminRelaunch"));
        void guard("requestAdminRelaunch", () => cmd.requestAdminRelaunch());
      })
    )
  );

  wrap.append(section(lang("p0.section.uac"), uacBody));

  // Market
  const mkBody = el("div", { className: "p0Body" });

  mkBody.append(
    row(
      btn(lang("p0.market.fetch"), () => {
        void guard("fetchMarketPlugins", () => cmd.fetchMarketPlugins()).then((list) => {
          if (list) log(`market plugins count = ${String(list.length)}`);
        });
      })
    )
  );

  wrap.append(section(lang("p0.section.market"), mkBody));

  // Packages
  const pkBody = el("div", { className: "p0Body" });
  const pkView = el("div", { className: "p0Body" });

  const listPk = (kind: "frontend" | "backend"): void => {
    void guard(`listPackages(${kind})`, () => cmd.listPackages(kind)).then((names) => {
      if (!names) return;

      pkView.innerHTML = "";
      pkView.append(kv(kind, names.length === 0 ? lang("p0.packages.none") : names.join(", ")));
    });
  };

  const importPk = (kind: "frontend" | "backend"): void => {
    void (async () => {
      if (!isDesktop) {
        showToast(lang("error.platformUnsupported"), "warn");
        return;
      }

      const ext = kind === "frontend" ? "mgf" : "mgr";

      const picked = await dialogOpen({
        multiple: false,
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
      });

      if (typeof picked !== "string" || !picked) return;

      const name = await guard(`importPackage(${kind})`, () => cmd.importPackage(picked, kind));
      if (name) {
        showToast(lang("toast.packageImported", { name }));
        renderPhase0Screen(root);
      }
    })();
  };

  pkBody.append(
    row(
      btn(lang("p0.packages.listFrontend"), () => listPk("frontend")),
      btn(lang("p0.packages.listBackend"), () => listPk("backend")),
      btn(lang("p0.packages.importFrontend"), () => importPk("frontend")),
      btn(lang("p0.packages.importBackend"), () => importPk("backend"))
    ),
    pkView
  );

  wrap.append(section(lang("p0.section.packages"), pkBody));

  // Lang
  const langBody = el("div", { className: "p0Body" });
  const localeLabel = el("span", { className: "p0V", text: getConfig().general.language });

  const switchTo = (id: string): void => {
    updateConfig((c) => {
      c.general.language = id;
    });

    log(`locale -> ${id}`);
    setLocale(id);
  };

  langBody.append(
    row(
      btn("简体中文", () => switchTo("zh-CN")),
      btn("繁體中文", () => switchTo("zh-TW")),
      btn("English", () => switchTo("en")),
      localeLabel
    )
  );

  wrap.append(section(lang("p0.section.lang"), langBody));

  // Log
  const logBody = el("div", { className: "p0Body" });
  const logBox = el("pre", { className: "p0Log mono", attrs: { id: "p0log" } });
  logBox.textContent = logLines.join("\n");

  logBody.append(
    row(
      btn(lang("p0.log.clear"), () => {
        logLines = [];
        logBox.textContent = "";
      })
    ),
    logBox
  );

  wrap.append(section(lang("p0.section.log"), logBody));

  root.append(wrap);

  refreshCloseState();
  pollTimer = setInterval(refreshCloseState, 1000);
}
