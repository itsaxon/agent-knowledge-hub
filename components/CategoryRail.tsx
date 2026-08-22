"use client";

import { CATEGORIES, type Category } from "@/lib/data";
import { useI18n } from "@/lib/i18n-context";

interface Props {
  active: Category["id"];
  onChange: (id: Category["id"]) => void;
  counts: Record<string, number>;
}

export function CategoryRail({ active, onChange, counts }: Props) {
  const { t } = useI18n();
  return (
    <aside className="hub-left-rail">
      <div className="hub-rail-label">{t("category.title")}</div>
      <nav className="flex flex-col" style={{ gap: 2 }}>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const isActive = active === c.id;
          return (
            <a
              key={c.id}
              href="#card-grid"
              onClick={(e) => {
                e.preventDefault();
                onChange(c.id);
              }}
              className={`hub-cat-link ${isActive ? "is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{t(c.labelKey)}</span>
              <span className="hub-cat-count">{counts[c.id] ?? 0}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
