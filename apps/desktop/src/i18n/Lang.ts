import { useState, useEffect } from 'react';
import zhTW from './locales/zh-TW';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

const locales: Record<string, Record<string, string>> = { 'zh-TW': zhTW, 'zh-CN': zhCN, 'en-US': enUS };
let currentLocale = 'zh-TW';
const listeners: Set<() => void> = new Set();

export const Lang = {
  get: (key: string, params?: Record<string, any>) => {
    let text = locales[currentLocale]?.[key] || locales['zh-TW']?.[key] || key;
    if (params) Object.entries(params).forEach(([k, v]) => { text = text.replace(`{${k}}`, String(v)); });
    return text;
  },
  setLocale: (loc: string) => {
    if (locales[loc]) { currentLocale = loc; listeners.forEach(fn => fn()); }
  },
  subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); } }
};

export function useLang() {
  const [, setTick] = useState(0);
  useEffect(() => Lang.subscribe(() => setTick(t => t + 1)), []);
  return Lang;
}
