"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import {
  CATEGORIES,
  STATUS_META,
  getCategoryIcon,
  getCategoryLabel,
  type Category,
  type KnowledgeEntry,
} from "@/lib/data";
import { useI18n } from "@/lib/i18n-context";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: KnowledgeEntry[];
  onSelect: (entry: KnowledgeEntry) => void;
  onCategorySelect?: (id: Category["id"]) => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  entries,
  onSelect,
  onCategorySelect,
}: Props) {
  const { locale, t } = useI18n();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return entries
      .filter((e) => {
        const haystack = [
          e.title,
          e.description,
          e.slug,
          e.category,
          getCategoryLabel(e.category, locale),
          ...e.tags,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [query, entries, locale]);

  const categoryMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CATEGORIES.filter((c) => {
      const label = t(c.labelKey).toLowerCase();
      return label.includes(q) || c.id.toLowerCase().includes(q);
    }).slice(0, 4);
  }, [query, t]);

  const total = results.length + categoryMatches.length;

  useEffect(() => {
    if (active >= total) setActive(total === 0 ? 0 : total - 1);
  }, [total, active]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (entry: KnowledgeEntry) => {
    onSelect(entry);
    onOpenChange(false);
  };
  const chooseCategory = (id: Category["id"]) => {
    onCategorySelect?.(id);
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cmd-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[110] flex items-start justify-center"
          style={{
            background: "rgba(0,0,0,0.5)",
            paddingTop: isMobile
              ? "calc(env(safe-area-inset-top) + 16px)"
              : "12vh",
            paddingLeft: isMobile ? 12 : 24,
            paddingRight: isMobile ? 12 : 24,
          }}
          onClick={() => onOpenChange(false)}
          role="dialog"
          aria-modal
          aria-label={t("palette.title")}
        >
          <motion.div
            key="cmd-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="w-full"
            style={{ maxWidth: 640 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, Math.max(total - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (active < categoryMatches.length) {
                  chooseCategory(categoryMatches[active].id);
                } else {
                  const entry = results[active - categoryMatches.length];
                  if (entry) choose(entry);
                }
              }
            }}
          >
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow-2)",
              }}
            >
              <div
                className="flex items-center"
                style={{
                  gap: 10,
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <Search size={18} strokeWidth={2} style={{ color: "var(--ink-3)" }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  placeholder={t("palette.placeholder")}
                  aria-label={t("palette.search")}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--ink)",
                    fontSize: isMobile ? 16 : 15,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "var(--tracking)",
                  }}
                />
                {!isMobile && <kbd className="hub-kbd">ESC</kbd>}
              </div>

              <div
                ref={listRef}
                className="no-scrollbar"
                style={{
                  maxHeight: isMobile ? "60dvh" : "60vh",
                  overflowY: "auto",
                }}
              >
                {total === 0 && (
                  <div
                    style={{
                      padding: "32px 16px",
                      textAlign: "center",
                      color: "var(--ink-3)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                    }}
                  >
                    {query
                      ? t("palette.noResults", { query })
                      : t("palette.empty")}
                  </div>
                )}

                {categoryMatches.length > 0 && (
                  <Section label={t("palette.sectionCategories")}>
                    {categoryMatches.map((c, i) => {
                      const Icon = c.icon;
                      const isActive = active === i;
                      return (
                        <CmdRow
                          key={`cat-${c.id}`}
                          index={i}
                          isActive={isActive}
                          onHover={() => setActive(i)}
                          onClick={() => chooseCategory(c.id)}
                        >
                          <Icon size={16} strokeWidth={2} />
                          <span>{t(c.labelKey)}</span>
                          <span
                            style={{
                              marginLeft: "auto",
                              color: isActive ? "inherit" : "var(--ink-3)",
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                            }}
                          >
                            {t("palette.goToCategory")}
                          </span>
                        </CmdRow>
                      );
                    })}
                  </Section>
                )}

                {results.length > 0 && (
                  <Section label={t("palette.sectionEntries")}>
                    {results.map((entry, i) => {
                      const idx = categoryMatches.length + i;
                      const Icon = getCategoryIcon(entry.category);
                      const status = STATUS_META[entry.status];
                      const isActive = active === idx;
                      return (
                        <CmdRow
                          key={`entry-${entry.id}`}
                          index={idx}
                          isActive={isActive}
                          onHover={() => setActive(idx)}
                          onClick={() => choose(entry)}
                        >
                          <Icon size={16} strokeWidth={2} />
                          <span style={{ color: isActive ? "var(--brand-ink)" : "var(--ink)" }}>
                            {entry.title}
                          </span>
                          <span
                            className="hub-status-dot"
                            style={{ background: status.color, marginInline: 6 }}
                            aria-hidden
                          />
                          <span
                            style={{
                              marginLeft: "auto",
                              color: isActive ? "inherit" : "var(--ink-3)",
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                            }}
                          >
                            {entry.slug}
                          </span>
                          {isActive && (
                            <CornerDownLeft
                              size={14}
                              strokeWidth={2}
                              style={{ color: "var(--ink-3)" }}
                            />
                          )}
                        </CmdRow>
                      );
                    })}
                  </Section>
                )}
              </div>

              <div
                className="flex items-center"
                style={{
                  gap: 16,
                  padding: "10px 16px",
                  borderTop: "1px solid var(--line)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink-3)",
                }}
              >
                {!isMobile && <span>{t("palette.navigate")}</span>}
                {!isMobile && <span>{t("palette.select")}</span>}
                <span style={{ marginLeft: "auto" }}>
                  {total} {total === 1 ? t("palette.result") : t("palette.results")}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          padding: "8px 16px",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function CmdRow({
  index,
  isActive,
  onHover,
  onClick,
  children,
}: {
  index: number;
  isActive: boolean;
  onHover: () => void;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-cmd-index={index}
      onMouseMove={onHover}
      onClick={onClick}
      className="flex w-full items-center"
      style={{
        gap: 10,
        padding: "10px 16px",
        textAlign: "left",
        background: isActive ? "var(--brand)" : "transparent",
        color: isActive ? "var(--brand-ink)" : "var(--ink-2)",
        border: "none",
        borderBottom: "1px solid var(--line)",
        fontSize: 14,
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </button>
  );
}
