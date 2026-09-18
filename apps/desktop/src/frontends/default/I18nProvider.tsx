import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
// ✅ 路径更新：直接引入同级 i18n 目录下的语言包
import { locales } from './i18n'; 

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children, initialLocale = 'zh-TW' }: { children: ReactNode; initialLocale?: string }) {
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback((newLocale: string) => {
    if (locales[newLocale]) {
      setLocaleState(newLocale);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let text = locales[locale]?.[key] || locales['zh-TW']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
