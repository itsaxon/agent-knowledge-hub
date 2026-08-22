"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { HeroSearch } from "@/components/HeroSearch";
import { CategoryRail } from "@/components/CategoryRail";
import { MobileCategoryRail } from "@/components/MobileCategoryRail";
import { CardGrid } from "@/components/CardGrid";
import { Footer } from "@/components/Footer";
import { DetailDrawer } from "@/components/DetailDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { useHotkey } from "@/hooks/useHotkey";
import { useI18n } from "@/lib/i18n-context";
import {
  getCategoryLabel,
  type Category,
  type KnowledgeEntry,
} from "@/lib/data";

const PAGE_SIZE = 48;

export function HubApp({ entries }: { entries: KnowledgeEntry[] }) {
  const [query, setQuery] = useState("");
  // Default to the News category. News renders a single flat list of every
  // article across all source folders — no source/period sub-filters.
  const [activeCategory, setActiveCategory] = useState<Category["id"]>("news");
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { locale } = useI18n();

  // Per-category counts — derived from the live (server-scanned) entries.
  const counts = useMemo(() => {
    const c: Record<Category["id"], number> = {
      all: entries.length,
      agents: 0,
      rules: 0,
      skills: 0,
      news: 0,
    };
    for (const cat of ["agents", "rules", "skills", "news"] as Category["id"][]) {
      c[cat] = entries.filter((e) => e.category === cat).length;
    }
    return c;
  }, [entries]);

  const openPalette = useCallback(() => setPaletteOpen(true), []);

  useHotkey({ key: "k", handler: () => setPaletteOpen((o) => !o) });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (activeCategory !== "all" && e.category !== activeCategory) return false;
      if (!q) return true;
      const haystack = [
        e.title,
        e.description,
        e.slug,
        e.author,
        getCategoryLabel(e.category, locale),
        ...e.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeCategory, locale, entries]);

  // Reset pagination whenever filter inputs change.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, activeCategory]);

  const handleCategoryChange = useCallback((id: Category["id"]) => {
    setActiveCategory(id);
    requestAnimationFrame(() => {
      // Scroll the card grid into view below the fixed header.
      document.getElementById("card-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const showMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  return (
    <main className="hub-app-root">
      {/* `.hub-page-root` is hidden while the mobile flow-reader is open
          (html.hub-flow-reader) so the detail drawer becomes the only
          scrollable content — required for iOS Safari toolbar collapse. */}
      <div className="hub-page-root">
        <Header
          onOpenPalette={openPalette}
          onSubmit={() => {
            document
              .getElementById("hero-search")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />

        <HeroSearch
          query={query}
          onQueryChange={setQuery}
          onOpenPalette={openPalette}
          counts={counts}
        />

        <div
          className="hub-container hub-pad-x"
          style={{ paddingBottom: 96 }}
        >
          <MobileCategoryRail
            active={activeCategory}
            onChange={handleCategoryChange}
            counts={counts}
          />
          <div className="hub-layout">
            <CategoryRail
              active={activeCategory}
              onChange={handleCategoryChange}
              counts={counts}
            />

            <div className="hub-main">
              <CardGrid
                entries={filtered}
                onSelect={setSelected}
                query={query}
                visibleCount={visibleCount}
                onShowMore={showMore}
              />
            </div>
          </div>
        </div>

        <Footer />
      </div>

      <DetailDrawer entry={selected} onClose={() => setSelected(null)} />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        entries={entries}
        onSelect={setSelected}
        onCategorySelect={handleCategoryChange}
      />
    </main>
  );
}
