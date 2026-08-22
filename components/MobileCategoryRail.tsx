"use client";

import { useEffect, useRef } from "react";
import { CATEGORIES, type Category } from "@/lib/data";
import { useI18n } from "@/lib/i18n-context";

interface Props {
  active: Category["id"];
  onChange: (id: Category["id"]) => void;
  counts: Record<string, number>;
}

/**
 * Horizontally-scrollable category chip bar shown only below 1024px, where the
 * desktop sidebar (`.hub-left-rail`) is hidden. The active chip is auto-scrolled
 * into view on change so it stays visible without manual swiping.
 */
export function MobileCategoryRail({ active, onChange, counts }: Props) {
  const { t } = useI18n();
  const railRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [active]);

  return (
    <div
      className="hub-mobile-cats"
      ref={railRef}
      role="tablist"
      aria-label={t("category.title")}
    >
      {CATEGORIES.map((c) => {
        const Icon = c.icon;
        const isActive = active === c.id;
        return (
          <button
            key={c.id}
            ref={isActive ? activeRef : undefined}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(c.id)}
            className={`hub-mobile-cat${isActive ? " is-active" : ""}`}
          >
            <Icon size={15} strokeWidth={2} />
            <span>{t(c.labelKey)}</span>
            <span className="hub-mobile-cat-count">{counts[c.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
