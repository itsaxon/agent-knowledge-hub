"use client";

import { Github, Plus, Square } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useI18n } from "@/lib/i18n-context";

interface Props {
  onSubmit?: () => void;
  onOpenPalette?: () => void;
}

export function Header({ onSubmit, onOpenPalette }: Props) {
  const { t } = useI18n();
  return (
    <header className="hub-header-bar sticky top-0 z-50 w-full">
      <div
        className="hub-container hub-pad-x flex items-center justify-between"
        style={{ height: 56 }}
      >
        <a
          href="#hero-search"
          className="flex items-center"
          style={{ gap: 8, minWidth: 0 }}
          aria-label={t("brand.name")}
        >
          <Square
            size={20}
            strokeWidth={2.5}
            style={{ color: "var(--ink)", flexShrink: 0 }}
          />
          <span
            className="font-semibold"
            style={{
              color: "var(--ink)",
              fontSize: 15,
              letterSpacing: "var(--tracking)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {t("brand.name")}
          </span>
        </a>

        <div
          className="flex items-center"
          style={{ gap: 8, flexShrink: 0 }}
        >
          <button
            type="button"
            onClick={onOpenPalette}
            className="hub-theme-toggle hub-compact-hide-sm inline-flex items-center justify-center"
            aria-label={t("nav.palette")}
            title={t("nav.palette")}
            style={{ width: 36, height: 36 }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink)",
                lineHeight: 1,
              }}
            >
              ⌘K
            </span>
          </button>
          <LanguageToggle />
          <ThemeToggle />
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="hub-theme-toggle inline-flex items-center justify-center"
            style={{ width: 36, height: 36 }}
          >
            <Github size={18} strokeWidth={2} />
          </a>
          <button type="button" onClick={onSubmit} className="hub-ghost-btn">
            <Plus size={18} strokeWidth={2.5} />
            <span className="hub-compact-hide-sm">{t("nav.submit")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
