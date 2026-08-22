"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import type { Locale } from "@/lib/i18n";

const LOCALES: Locale[] = ["en", "zh"];

/**
 * Inline language toggle — cycles EN → ZH → EN.
 * Shows the *current* locale as a compact chip; aria-label is localized.
 */
export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const next: Locale = locale === "en" ? "zh" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="hub-theme-toggle inline-flex items-center justify-center"
      style={{ gap: 6, paddingInline: 10, minWidth: 52, height: 36 }}
      aria-label={t("nav.language")}
      title={t("nav.language")}
    >
      <Languages size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--ink)",
          letterSpacing: "0.04em",
          lineHeight: 1,
          minWidth: 14,
          textAlign: "center",
        }}
      >
        {locale === "en" ? t("nav.languageEn") : t("nav.languageZh")}
      </span>
    </button>
  );
}

export { LOCALES };
