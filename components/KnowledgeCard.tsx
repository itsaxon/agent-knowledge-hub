"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  STATUS_META,
  getCategoryIcon,
  getCategoryLabel,
  getEntryDescription,
  getNewsPeriodLabel,
  getStatusLabel,
  type KnowledgeEntry,
} from "@/lib/data";
import { useI18n } from "@/lib/i18n-context";

interface Props {
  entry: KnowledgeEntry;
  index: number;
  onSelect: (entry: KnowledgeEntry) => void;
}

export function KnowledgeCard({ entry, index, onSelect }: Props) {
  const { locale, t } = useI18n();
  const Icon = getCategoryIcon(entry.category);
  const status = STATUS_META[entry.status];
  const categoryLabel = getCategoryLabel(entry.category, locale);
  const statusLabel = getStatusLabel(entry.status, locale);
  // Card description follows the global UI locale — except for `zhOnly`
  // entries (news digests), which are Chinese in every locale.
  const description = getEntryDescription(entry, locale);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.28,
        delay: Math.min(index * 0.04, 0.24),
        ease: [0.2, 0.8, 0.2, 1],
      }}
      className="hub-card"
      onClick={() => onSelect(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(entry);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${t("card.viewDetails")} ${entry.title}`}
      data-category={entry.category}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center" style={{ gap: 6 }}>
          <span className="hub-tag">{categoryLabel}</span>
          {entry.source && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                padding: "2px 6px",
              }}
            >
              {entry.source}
            </span>
          )}
          {entry.period && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "var(--ink-3)",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                padding: "2px 6px",
              }}
            >
              {getNewsPeriodLabel(entry.period, locale)}
            </span>
          )}
        </div>
        <span
          className="inline-flex items-center"
          style={{ gap: 6, fontSize: 12, color: "var(--ink-3)" }}
        >
          <span
            className="hub-status-dot"
            style={{ background: status.color }}
            aria-hidden
          />
          {statusLabel}
        </span>
      </div>

      <h3 className="hub-card-title" style={{ marginTop: 16 }}>
        {entry.title}
      </h3>
      <p
        className="hub-card-desc"
        style={{
          marginTop: 8,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </p>

      {/* Spacer absorbs leftover height so the tags + meta block sits at
          the card bottom — keeping tag → divider → meta spacing equal
          across all cards in the same grid row. */}
      <div style={{ marginTop: "auto" }} />

      {entry.tags.length > 0 && (
        <div
          className="flex flex-wrap"
          style={{ gap: 6, marginTop: 20, minHeight: 22 }}
        >
          {entry.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--ink-3)",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                padding: "2px 6px",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div
        className="hub-card-meta-row hub-card-meta flex items-center"
        style={{
          gap: 8,
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--line)",
        }}
      >
        <Icon size={14} strokeWidth={2} />
        <span>{entry.slug}</span>
        {/* News digests already carry the date in their slug, so the meta
            row omits the "Updated" stamp for them. */}
        {entry.category !== "news" && (
          <span style={{ marginLeft: "auto" }}>
            {t("card.updated")} {entry.updatedAt}
          </span>
        )}
        <ChevronRight
          className="hub-card-meta-icon"
          size={14}
          strokeWidth={2}
          style={entry.category === "news" ? { marginLeft: "auto" } : undefined}
        />
      </div>
    </motion.article>
  );
}
