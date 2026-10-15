import zhCN from "./locales/zh-CN.json";
import zhTW from "./locales/zh-TW.json";
import en from "./locales/en.json";

const localePacks: Record<string, Record<string, string>> = {
  "zh-CN": zhCN as Record<string, string>,
  "zh-TW": zhTW as Record<string, string>,
  en: en as Record<string, string>,
};

const FALLBACK = "zh-CN";
let currentLocale = FALLBACK;
const listeners = new Set<(locale: string) => void>();

export function setLocale(locale: string): void {
  currentLocale = localePacks[locale] ? locale : FALLBACK;
  listeners.forEach((fn) => fn(currentLocale));
}

export function getLocale(): string {
  return currentLocale;
}

export function lang(key: string, vars?: Record<string, string | number>): string {
  let text = localePacks[currentLocale]?.[key] ?? localePacks[FALLBACK]?.[key] ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.split(`{${k}}`).join(String(v));
    }
  }

  return text;
}

export function onLocaleChange(fn: (locale: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
