"use client";

import { useCallback, useEffect, useState } from "react";
import { I18nContext } from "@/lib/i18n-context";
import { TRANSLATIONS, translate, type Locale, type TranslationKey } from "@/lib/i18n";
import { LOCALE_COOKIE, migrateFromLocalStorage, writeCookie } from "@/lib/prefs";

interface Props {
  children: React.ReactNode;
  /**
   * Locale resolved on the server from the `hub-locale` cookie. Must match
   * what the server rendered into <html lang> / <html data-locale>.
   */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = "en" }: Props) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    writeCookie(LOCALE_COOKIE, l);
    // Keep the document in sync for assistive tech and CSS hooks.
    const root = document.documentElement;
    root.lang = l === "zh" ? "zh-CN" : "en";
    root.dataset.locale = l;
  }, []);

  // One-time migration for visitors whose locale is still in localStorage.
  useEffect(() => {
    const migrated = migrateFromLocalStorage(
      LOCALE_COOKIE,
      (v) => v === "en" || v === "zh",
    );
    if (migrated === "en" || migrated === "zh") setLocale(migrated);
  }, [setLocale]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/** Static lookup for server components (no reactivity). */
export function getStaticT(locale: Locale) {
  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}

export { TRANSLATIONS };
