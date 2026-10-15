import type { MorgetConfig } from "../bridge/backendApi";

type StyleOverrides = Record<string, string>;

const PRESETS: Record<string, StyleOverrides> = {
  dark: {},
  light: {
    "--bg": "#f5f7fa",
    "--border": "#d0d7de",
    "--secondary": "#ffffff",
    "--primary-text": "#1f4fd8",
    "--secondary-text": "#57606a",
    "--other-text": "#57606a",
  },
  cbDeuteranopia: {
    "--primary": "#0072b2",
    "--accent": "#56b4e9",
    "--primary-effect": "#004488",
    "--secondary-effect": "#56b4e9",
  },
  cbProtanopia: {
    "--primary": "#d55e00",
    "--accent": "#e69f00",
    "--primary-effect": "#8f3e00",
    "--secondary-effect": "#e69f00",
  },
  cbTritanopia: {
    "--primary": "#009e73",
    "--accent": "#cc79a7",
    "--primary-effect": "#006a4d",
    "--secondary-effect": "#cc79a7",
  },
};

export function applyTheme(cfg: MorgetConfig): void {
  const root = document.documentElement;
  const s = cfg.style;

  const vars: Record<string, string> = {
    "--primary": s.primaryColor,
    "--secondary": s.secondaryColor,
    "--accent": s.accentColor,
    "--bg": s.backgroundColor,
    "--border": s.borderColor,
    "--primary-effect": s.primaryEffectColor,
    "--secondary-effect": s.secondaryEffectColor,
    "--primary-text": s.primaryTextColor,
    "--secondary-text": s.secondaryTextColor,
    "--other-text": s.otherTextColor,
    "--ui-scale": String(Math.max(cfg.graphics.uiScale, 10) / 50),
    "--font-scale": String(Math.max(cfg.graphics.fontScale, 10) / 50),
  };

  for (const [k, v] of Object.entries(PRESETS[s.theme] ?? {})) {
    vars[k] = v;
  }

  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }

  root.classList.toggle("fancy", cfg.graphics.fancyGraphics);
}

export function applyThemePreset(name: string): StyleOverrides {
  return PRESETS[name] ?? {};
}
