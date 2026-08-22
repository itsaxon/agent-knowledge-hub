"use client";

import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { CATEGORIES } from "@/lib/data";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  onOpenPalette?: () => void;
  counts: Record<string, number>;
}

export function HeroSearch({ query, onQueryChange, onOpenPalette, counts }: Props) {
  const { t } = useI18n();
  const isMobile = useIsMobile();

  const padY = isMobile ? 48 : 80;
  const padB = isMobile ? 36 : 64;
  const titleSize = isMobile ? 28 : 40;
  const inputHeight = isMobile ? 52 : 48;

  return (
    <section
      id="hero-search"
      className="hub-pad-x"
      style={{
        paddingTop: padY,
        paddingBottom: padB,
      }}
    >
      <div
        className="hub-container flex flex-col items-center text-center"
        style={{ maxWidth: 720 }}
      >
        <span className="hub-eyebrow">{t("hero.eyebrow")}</span>
        <h1
          className="font-semibold"
          style={{
            color: "var(--ink)",
            fontSize: titleSize,
            lineHeight: 1.15,
            letterSpacing: "var(--tracking)",
            marginTop: 16,
          }}
        >
          {t("hero.title")}
        </h1>
        <p
          style={{
            marginTop: 16,
            color: "var(--ink-2)",
            fontSize: isMobile ? 14 : 15,
            lineHeight: 1.6,
            letterSpacing: "var(--tracking)",
          }}
        >
          {t("hero.subtitle")}
        </p>

        <div className="relative w-full" style={{ marginTop: isMobile ? 24 : 32 }}>
          <Search
            size={18}
            strokeWidth={2}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-3)",
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onOpenPalette}
            placeholder={t("hero.searchPlaceholder")}
            className="hub-search w-full"
            style={{
              height: inputHeight,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 0,
              paddingLeft: 44,
              paddingRight: isMobile ? 16 : 64,
              color: "var(--ink)",
              letterSpacing: "var(--tracking)",
              boxShadow: "var(--shadow-1)",
            }}
            aria-label={t("hero.searchLabel")}
          />
          {!isMobile && (
            <kbd
              className="hub-kbd"
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              ⌘K
            </kbd>
          )}
        </div>

        <div
          className="flex flex-wrap items-center justify-center"
          style={{ gap: isMobile ? 8 : 12, marginTop: isMobile ? 20 : 24 }}
        >
          {CATEGORIES.map((c) => (
            <StatPill
              key={c.id}
              label={t(c.labelKey)}
              count={counts[c.id] ?? 0}
              compact={isMobile}
            />
          ))}
          <StatPill
            label={t("hero.total")}
            count={counts.all ?? 0}
            compact={isMobile}
          />
        </div>
      </div>
    </section>
  );
}

function StatPill({
  label,
  count,
  compact,
}: {
  label: string;
  count: number;
  compact?: boolean;
}) {
  return (
    <div
      className="hub-stat-pill"
      style={compact ? { padding: "6px 10px", fontSize: 12 } : undefined}
    >
      <span>{label}</span>
      <span className="hub-stat-num">{count}</span>
    </div>
  );
}
