import "./styles/main.css";

import { initConfig, saveNow, updateConfig, getConfig } from "./config/configStore";
import { setLocale, onLocaleChange, lang } from "./lang/lang";
import { applyTheme } from "./ui/theme";
import { frameScheduler } from "./ui/frameScheduler";
import { initHotkeys } from "./ui/hotkeyService";
import { isDesktop, cmd, errorText } from "./bridge/backendApi";
import { showChoiceModal, showToast } from "./ui/components";
import { listen } from "@tauri-apps/api/event";
import { renderPhase0Screen, isAckSuppressed, log } from "./ui/phase0Screen";

async function showCloseDialog(): Promise<void> {
  const result = await showChoiceModal({
    titleKey: "closeDialog.title",
    messageKey: "closeDialog.message",
    options: [
      { labelKey: "closeDialog.toTray", value: "tray" },
      { labelKey: "closeDialog.exit", value: "exit", danger: true },
    ],
    checkboxKey: "closeDialog.dontAsk",
  });

  if (!result) {
    log("close dialog cancelled");
    await cmd.resolveCloseRequest("cancel").catch(() => undefined);
    return;
  }

  if (result.checked) {
    updateConfig((cfg) => {
      cfg.advanced.closeDontAsk = true;
      cfg.advanced.closeBehavior = result.value;
    });

    try {
      await saveNow();
    } catch (e) {
      log(`saveNow failed: ${errorText(e)}`);
      showToast(lang("toast.error", { message: errorText(e) }), "error");
    }
  }

  log(`close resolved: ${result.value}`);
  await cmd.resolveCloseRequest(result.value).catch(() => undefined);
}

function mountScreen(): void {
  const root = document.getElementById("app");
  if (!root) throw new Error("#app not found");
  renderPhase0Screen(root);
}

async function boot(): Promise<void> {
  const cfg = await initConfig();

  setLocale(cfg.general.language);
  applyTheme(cfg);

  frameScheduler.setFps(cfg.general.fps);
  frameScheduler.start();

  initHotkeys();

  onLocaleChange(() => {
    mountScreen();
  });

  mountScreen();

  const urlParams = new URLSearchParams(window.location.search);
  const skipCloseHandler = urlParams.get("noCloseHandler") === "1";
  let closeDialogOpen = false;

  if (isDesktop && !skipCloseHandler) {
    await listen("morget://closeRequested", () => {
      if (!isAckSuppressed()) {
        cmd.ackCloseRequest().catch(() => undefined);
      } else {
        log("closeRequested received but ack SUPPRESSED");
      }

      if (closeDialogOpen) {
        log("closeRequested ignored (dialog already open)");
        return;
      }

      closeDialogOpen = true;

      void showCloseDialog().finally(() => {
        closeDialogOpen = false;
      });
    });

    log("closeRequested listener registered");
  } else if (isDesktop) {
    log("closeRequested listener SKIPPED (?noCloseHandler=1)");
  }

  if (!isDesktop) {
    showToast(lang("web.notDesktop"), "warn", 8000);
  }

  log(`boot ok, locale=${cfg.general.language}, desktop=${String(isDesktop)}`);
}

void boot().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("[Morget] boot failed:", e);

  try {
    const root = document.getElementById("app");
    if (root) {
      root.textContent = `${lang("error.bootFailed", { message: msg })}\n\n${String(e)}`;
      root.style.whiteSpace = "pre-wrap";
      root.style.padding = "24px";
    }
  } catch {
    // If DOM is unavailable, console is the only fallback.
  }
});
