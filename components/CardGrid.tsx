"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SearchX } from "lucide-react";
import { KnowledgeCard } from "./KnowledgeCard";
import type { KnowledgeEntry } from "@/lib/data";
import { useI18n } from "@/lib/i18n-context";

interface Props {
  entries: KnowledgeEntry[];
  onSelect: (entry: KnowledgeEntry) => void;
  query: string;
  /** Number of cards already revealed. */
  visibleCount: number;
  onShowMore: () => void;
}

export function CardGrid({
  entries,
  onSelect,
  query,
  visibleCount,
  onShowMore,
}: Props) {
  const { t } = useI18n();
  const visible = entries.slice(0, visibleCount);
  const remaining = entries.length - visible.length;
  const hasMore = remaining > 0;

  return (
    <div id="card-grid" className="hub-grid">
      <AnimatePresence mode="popLayout">
        {visible.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hub-empty"
            style={{ gridColumn: "1 / -1" }}
          >
            <SearchX
              size={28}
              strokeWidth={1.5}
              style={{ margin: "0 auto 12px", display: "block" }}
            />
            {t("grid.empty")}
            {query ? (
              <span style={{ display: "block", marginTop: 6 }}>
                {t("grid.emptyHint", { query })}
              </span>
            ) : null}
          </motion.div>
        ) : (
          visible.map((entry, i) => (
            <KnowledgeCard
              key={entry.id}
              entry={entry}
              index={i}
              onSelect={onSelect}
            />
          ))
        )}
      </AnimatePresence>

      {hasMore && (
        <motion.div
          key="show-more"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ gridColumn: "1 / -1", marginTop: 8 }}
        >
          <button
            type="button"
            onClick={onShowMore}
            className="hub-ghost-btn"
            style={{ width: "100%", justifyContent: "center", height: 44 }}
          >
            <ChevronDown size={16} strokeWidth={2.5} />
            {t("grid.showMore")} · {remaining} {t("grid.remaining")}
          </button>
        </motion.div>
      )}
    </div>
  );
}
