import { MorgetConfig, cmd, isDesktop } from "../bridge/backendApi";
import { getConfig, updateConfig } from "../config/configStore";

const codeToName: Record<string, string> = {
  Space: "Space",
  Enter: "Enter",
  Tab: "Tab",
  Backspace: "Backspace",
  Escape: "Escape",
  Delete: "Delete",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
};

export function keyNameFromCode(code: string): string | null {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return `Num${code.slice(6)}`;
  if (/^F\d{1,2}$/.test(code)) return code;

  const named = codeToName[code];
  if (named) return named;

  const symbols: Record<string, string> = {
    Comma: ",",
    Period: ".",
    Slash: "/",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    BracketLeft: "[",
    BracketRight: "]",
    Minus: "-",
    Equal: "=",
    Backquote: "`",
  };

  return symbols[code] ?? null;
}

export function comboFromKeyEvent(e: KeyboardEvent): string {
  const main = keyNameFromCode(e.code);
  if (!main) return "";

  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  parts.push(main);

  return parts.join("+");
}

export function parseCombo(combo: string): string[] {
  return combo ? combo.split("+") : [];
}

export function mouseButtonName(button: number): string {
  return `Mouse${button + 1}`;
}

export function comboMatches(e: KeyboardEvent, combo: string): boolean {
  return combo ? comboFromKeyEvent(e) === combo : false;
}

async function doFullscreenToggle(): Promise<void> {
  const cfg = getConfig();
  if (!isDesktop) return;

  const next = cfg.graphics.windowMode === "windowed" ? "borderless" : "windowed";

  updateConfig((c) => {
    c.graphics.windowMode = next;
  });

  await cmd
    .applyWindowMode(next, cfg.graphics.windowWidth, cfg.graphics.windowHeight)
    .catch(() => undefined);
}

function onKeyDown(e: KeyboardEvent): void {
  if ((window as unknown as { __morgetRecording?: boolean }).__morgetRecording) return;

  const cfg = getConfig();

  if (comboMatches(e, cfg.hotkeys.fullscreen)) {
    e.preventDefault();
    void doFullscreenToggle();
  } else if (comboMatches(e, cfg.hotkeys.restart)) {
    e.preventDefault();
    void cmd.restartApp().catch(() => undefined);
  } else if (comboMatches(e, cfg.hotkeys.close)) {
    e.preventDefault();
    void cmd.requestClose().catch(() => undefined);
  }
}

export function initHotkeys(): void {
  window.addEventListener("keydown", onKeyDown);
}

export function rebindHotkeys(_cfg: MorgetConfig): void {}

export function findConflicts(cfg: MorgetConfig): Set<string> {
  const values = [cfg.hotkeys.fullscreen, cfg.hotkeys.restart, cfg.hotkeys.close];
  const conflicts = new Set<string>();

  values.forEach((v, i) => {
    if (v && values.some((other, j) => j !== i && other === v)) {
      conflicts.add(v);
    }
  });

  return conflicts;
}

export function startRecording(): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;

    (window as unknown as { __morgetRecording?: boolean }).__morgetRecording = true;

    const finish = (value: string | null): void => {
      if (settled) return;

      settled = true;
      (window as unknown as { __morgetRecording?: boolean }).__morgetRecording = false;
      cleanup();
      resolve(value);
    };

    const onKey = (e: KeyboardEvent): void => {
      if (e.repeat) return;

      e.preventDefault();
      e.stopPropagation();

      if (e.code === "Escape") {
        finish(null);
        return;
      }

      const combo = comboFromKeyEvent(e);

      if (combo && parseCombo(combo).length <= 3) {
        finish(combo);
      } else {
        finish(null);
      }
    };

    const onMouse = (e: MouseEvent): void => {
      e.preventDefault();
      e.stopPropagation();

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      parts.push(mouseButtonName(e.button));

      if (parts.length > 3) finish(null);
      else finish(parts.join("+"));
    };

    const onContextMenu = (e: Event): void => {
      e.preventDefault();
    };

    const cleanup = (): void => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("mousedown", onMouse, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("mousedown", onMouse, true);
    window.addEventListener("contextmenu", onContextMenu, true);
  });
}
