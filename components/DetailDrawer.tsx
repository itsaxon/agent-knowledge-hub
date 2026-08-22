"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CalendarClock, Check, ChevronRight, Copy, Cpu, FileText, Languages, Loader2, Maximize2, Minimize2, Pin, PinOff, Wrench, X } from "lucide-react";
import {
  STATUS_META,
  getCategoryIcon,
  getCategoryLabel,
  getStatusLabel,
  type KnowledgeEntry,
} from "@/lib/data";
import { useI18n } from "@/lib/i18n-context";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Markdown } from "./Markdown";

interface Props {
  entry: KnowledgeEntry | null;
  onClose: () => void;
}

type DocLocale = "original" | "zh-CN";

type LoadState =
  | { kind: "idle" }
  | { kind: "success"; content: string; usedLocale: DocLocale };

/** One table-of-contents entry derived from a rendered markdown heading. */
interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function DetailDrawer({ entry, onClose }: Props) {
  const { locale: uiLocale, t } = useI18n();
  const isMobile = useIsMobile();
  const [state, setState] = useState<LoadState>({ kind: "idle" });
  // Per-article language for the document body. Defaults to follow the global
  // UI locale (zh → zh-CN, en → original), but the user can override per
  // article via the Original/Chinese toggle buttons.
  const [docLocale, setDocLocale] = useState<DocLocale>("original");
  // Fullscreen reader mode: the panel fills the viewport and a table of
  // contents is rendered on the right for quick heading jumps.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeTocId, setActiveTocId] = useState("");
  const panelRef = useRef<HTMLElement | null>(null);
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const headingsRef = useRef<HTMLElement[]>([]);
  // Resizable TOC width (fullscreen reader mode). User can drag the divider
  // to widen/narrow the TOC panel. Clamped to 180–600px.
  const [tocWidth, setTocWidth] = useState(264);
  const draggingRef = useRef(false);
  // News dot-TOC: collapsed (dots) by default, expands on hover.
  const [tocHovered, setTocHovered] = useState(false);
  // When pinned, the TOC panel stays open even after the mouse leaves.
  const [tocPinned, setTocPinned] = useState(false);
  // Whether the news reader body has been scrolled past a small threshold.
  // Drives a floating back-to-list button that only appears while reading.
  const [newsScrolled, setNewsScrolled] = useState(false);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !panelRef.current) return;
      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = panelRect.right - e.clientX;
      setTocWidth(Math.max(180, Math.min(600, newWidth)));
    };
    const handleMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // News entries open directly in fullscreen. Deriving this from the entry at
  // render time (instead of setting it via an effect after the first paint)
  // avoids a one-frame flash where the centered non-fullscreen panel is shown
  // and then swapped to fullscreen. `isFullscreen` is still the source of truth
  // once the drawer is open (the user can toggle it), so we keep the state but
  // let news entries opt into fullscreen on the very first render. Declared
  // early so the TOC/scroll effects below can reference it.
  const effectiveFullscreen = isFullscreen || entry?.category === "news";

  // Mobile flow-reader mode: while the drawer is open on a phone it renders
  // in normal document flow (the underlying page is hidden) instead of a
  // fixed overlay with internal scrolling. iOS Safari only collapses its
  // bottom toolbar in response to *document* scroll — scrolling an inner
  // overflow container inside a fixed overlay keeps the toolbar expanded for
  // the whole reading session, which hurts long-article readability.
  const flowMode = isMobile && !!entry;

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  useEffect(() => {
    if (!entry) {
      setState({ kind: "idle" });
      return;
    }
    // News entries default to fullscreen reader mode with the TOC widened
    // to the maximum so all headings are visible at a glance. Other
    // categories open in the normal centered view.
    const isNews = entry.category === "news";
    setIsFullscreen(isNews);
    if (isNews) setTocWidth(600);
    // When a new entry opens, default the document locale to match the
    // global UI locale. `zhOnly` entries have a single Chinese source file,
    // so they always read the original.
    if (entry.zhOnly) {
      setDocLocale("original");
      return;
    }
    setDocLocale(uiLocale === "zh" ? "zh-CN" : "original");
  }, [entry, uiLocale]);

  useEffect(() => {
    if (!entry) {
      setState({ kind: "idle" });
      return;
    }
    // Read content directly from the entry object (pre-built at build time).
    const content = entry.zhOnly
      ? entry.content
      : docLocale === "zh-CN" && entry.contentZh
        ? entry.contentZh
        : entry.content;
    const usedLocale: DocLocale = entry.zhOnly
      ? "original"
      : docLocale === "zh-CN" && entry.contentZh
        ? "zh-CN"
        : "original";
    setState({ kind: "success", content, usedLocale });
  }, [entry, docLocale]);

  // Build the TOC from the headings that the markdown renderer produced.
  // Runs after every content change (entry switch or language toggle); the
  // assigned ids double as scroll targets for the TOC buttons.
  useEffect(() => {
    if (!entry || state.kind !== "success") {
      setTocItems([]);
      setActiveTocId("");
      headingsRef.current = [];
      return;
    }
    // Gather headings from every `.hub-md` block. News digests render two of
    // them — a metadata lead callout (no headings) followed by the body — so
    // querying only the first `.hub-md` would miss the body's headings and
    // yield an empty TOC.
    const mdNodes = panelRef.current?.querySelectorAll(".hub-md");
    if (!mdNodes || mdNodes.length === 0) {
      setTocItems([]);
      headingsRef.current = [];
      return;
    }
    const nodes = Array.from(mdNodes)
      .flatMap((md) => Array.from(md.querySelectorAll("h1, h2, h3")))
      .filter((n) => (n as HTMLElement).textContent?.trim()) as HTMLElement[];
    const seen = new Map<string, number>();
    const items: TocItem[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const text = (node.textContent ?? "").trim();
      if (!text) continue;
      const id = slugifyHeading(text, i, seen);
      node.id = id;
      node.style.scrollMarginTop = "24px";
      items.push({ id, text, level: Number(node.tagName.slice(1)) || 2 });
    }
    headingsRef.current = nodes;
    setTocItems(items);
  }, [entry, state, effectiveFullscreen]);

  // While in fullscreen, highlight the TOC entry of the heading currently in
  // view (the last heading whose top has scrolled past a small offset). In
  // flow-reader mode the scroller is the window, not the reader column.
  useEffect(() => {
    if (!effectiveFullscreen || tocItems.length === 0) return;
    const scroller: HTMLElement | Window | null = flowMode
      ? window
      : mainScrollRef.current;
    if (!scroller) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const scrollerTop = flowMode
        ? 0
        : (mainScrollRef.current?.getBoundingClientRect().top ?? 0);
      let current = headingsRef.current[0]?.id ?? "";
      for (const h of headingsRef.current) {
        if (h.getBoundingClientRect().top - scrollerTop <= 96) current = h.id;
        else break;
      }
      setActiveTocId(current);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [effectiveFullscreen, tocItems, flowMode]);

  // Floating back button for news fullscreen reader: appears only after the
  // user scrolls down a bit, fades out near the top. Uses the same scroller
  // as the TOC highlight effect.
  useEffect(() => {
    if (!effectiveFullscreen || entry?.category !== "news") {
      setNewsScrolled(false);
      return;
    }
    const scroller: HTMLElement | Window | null = flowMode
      ? window
      : mainScrollRef.current;
    if (!scroller) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const scrolled = flowMode
        ? window.scrollY
        : (scroller as HTMLElement).scrollTop;
      setNewsScrolled(scrolled > 120);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [effectiveFullscreen, entry, flowMode]);

  const handleTocJump = useCallback((id: string) => {
    setActiveTocId(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!entry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // First Escape exits fullscreen; a second one closes the drawer.
      if (isFullscreenRef.current) setIsFullscreen(false);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    // Lock background scrolling only for the desktop overlay modal. In
    // flow-reader mode the document itself must stay scrollable.
    let prev: string | undefined;
    if (!flowMode) {
      prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      if (!flowMode && prev !== undefined) document.body.style.overflow = prev;
    };
  }, [entry, onClose, flowMode]);

  // Flow-reader mode: hide the regular page, start the reader at the top,
  // and restore the previous scroll position when the drawer closes.
  useEffect(() => {
    if (!flowMode) return;
    document.documentElement.classList.add("hub-flow-reader");
    const savedScroll = window.scrollY;
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.classList.remove("hub-flow-reader");
      window.scrollTo(0, savedScroll);
    };
  }, [flowMode]);

  return (
    <AnimatePresence>
      {entry && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={
            flowMode
              ? "hub-flow-overlay"
              : "fixed inset-0 z-[100] flex items-center justify-center"
          }
          style={
            flowMode
              ? undefined
              : {
                  background: "rgba(0,0,0,0.5)",
                  padding: effectiveFullscreen || isMobile ? 0 : "5% 24px",
                }
          }
          onClick={flowMode ? undefined : onClose}
          aria-modal
          role="dialog"
        >
          <motion.aside
            key="panel"
            ref={(el) => {
              panelRef.current = el;
            }}
            // Fullscreen panels fill the viewport, so translate/scale would
            // cause a visible jolt on a large surface. Fade-only for them.
            initial={
              effectiveFullscreen || isMobile
                ? { opacity: 0 }
                : { opacity: 0, y: 16, scale: 0.98 }
            }
            animate={
              effectiveFullscreen || isMobile
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              effectiveFullscreen || isMobile
                ? { opacity: 0 }
                : { opacity: 0, y: 16, scale: 0.98 }
            }
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className={
              flowMode
                ? "relative"
                : effectiveFullscreen
                  ? "relative overflow-hidden"
                  : "relative w-full overflow-y-auto"
            }
            style={
              flowMode
                ? {
                    width: "100%",
                    background: "var(--surface)",
                  }
                : effectiveFullscreen || isMobile
                  ? {
                      width: "100%",
                      height: "100%",
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                    }
                  : {
                      maxWidth: 720,
                      maxHeight: "100%",
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      boxShadow: "var(--shadow-2)",
                    }
            }
            onClick={(e) => e.stopPropagation()}
          >
            {effectiveFullscreen ? (
              entry.category === "news" ? (
                /* News: compact dot navigation — dots by default, expands on
                   hover to show the full heading list. */
                <div
                  className="hub-reader-layout"
                  style={{ gridTemplateColumns: "minmax(0, 1fr) 28px" }}
                >
                  <div className="hub-reader-main" ref={mainScrollRef}>
                    {/* Floating back-to-list button — only for news fullscreen,
                        only visible after scrolling into the article body. */}
                    <button
                      type="button"
                      className={
                        "hub-news-back" + (newsScrolled ? " is-visible" : "")
                      }
                      onClick={onClose}
                      aria-label={t("drawer.close")}
                      title={t("drawer.close")}
                    >
                      <ArrowLeft size={18} strokeWidth={2} />
                    </button>
                    <div style={{ maxWidth: 860, margin: "0 auto" }}>
                      <DrawerContent
                        entry={entry}
                        state={state}
                        docLocale={docLocale}
                        onDocLocaleChange={setDocLocale}
                        onClose={onClose}
                        isFullscreen={effectiveFullscreen}
                        isMobile={isMobile}
                        onToggleFullscreen={() => setIsFullscreen((f) => !f)}
                        onTocJump={handleTocJump}
                      />
                    </div>
                  </div>
                  <div
                    className="hub-news-toc"
                    onMouseEnter={() => setTocHovered(true)}
                    onMouseLeave={() => {
                      if (!tocPinned) setTocHovered(false);
                    }}
                  >
                    <div className="hub-news-toc-dots">
                      {tocItems
                        .filter((item) => item.level === 2)
                        .map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={
                              "hub-news-dot" +
                              (item.id === activeTocId ? " is-active" : "")
                            }
                            onClick={() => handleTocJump(item.id)}
                            title={item.text}
                          />
                        ))}
                    </div>
                    <div
                      className={
                        "hub-news-toc-panel" +
                        (tocHovered || tocPinned ? " is-open" : "") +
                        (tocPinned ? " is-pinned" : "")
                      }
                    >
                      <div className="hub-news-toc-header">
                        <span className="hub-rail-label">{t("drawer.toc")}</span>
                        <button
                          type="button"
                          className="hub-news-toc-pin"
                          onClick={() => setTocPinned((p) => !p)}
                          title={tocPinned ? "取消固定" : "固定目录"}
                        >
                          {tocPinned ? <PinOff size={14} /> : <Pin size={14} />}
                        </button>
                      </div>
                      <div className="flex flex-col" style={{ gap: 2 }}>
                        {tocItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleTocJump(item.id)}
                            className={
                              "hub-toc-item" +
                              (item.id === activeTocId ? " is-active" : "")
                            }
                            style={{
                              paddingLeft: item.level >= 3 ? 26 : 12,
                            }}
                            title={item.text}
                          >
                            {item.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-news: resizable text TOC with drag divider. */
                <div
                  className="hub-reader-layout"
                  style={{ gridTemplateColumns: `minmax(0, 1fr) 6px ${tocWidth}px` }}
                >
                  <div className="hub-reader-main" ref={mainScrollRef}>
                    <div style={{ maxWidth: 860, margin: "0 auto" }}>
                      <DrawerContent
                        entry={entry}
                        state={state}
                        docLocale={docLocale}
                        onDocLocaleChange={setDocLocale}
                        onClose={onClose}
                        isFullscreen={effectiveFullscreen}
                        isMobile={isMobile}
                        onToggleFullscreen={() => setIsFullscreen((f) => !f)}
                        onTocJump={handleTocJump}
                      />
                    </div>
                  </div>
                  <div
                    className="hub-reader-resizer"
                    onMouseDown={handleResizeStart}
                  />
                  <nav
                    className="hub-reader-toc"
                    aria-label={t("drawer.toc")}
                  >
                    <div className="hub-rail-label">{t("drawer.toc")}</div>
                    {tocItems.length === 0 ? (
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          color: "var(--ink-3)",
                          padding: "0 12px",
                          lineHeight: 1.6,
                        }}
                      >
                        {t("drawer.tocEmpty")}
                      </div>
                    ) : (
                      <div className="flex flex-col" style={{ gap: 2 }}>
                        {tocItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleTocJump(item.id)}
                            className={
                              "hub-toc-item" +
                              (item.id === activeTocId ? " is-active" : "")
                            }
                            style={{
                              paddingLeft: item.level >= 3 ? 26 : 12,
                            }}
                            title={item.text}
                          >
                            {item.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </nav>
                </div>
              )
            ) : (
              <DrawerContent
                entry={entry}
                state={state}
                docLocale={docLocale}
                onDocLocaleChange={setDocLocale}
                onClose={onClose}
                isFullscreen={isFullscreen}
                isMobile={isMobile}
                onToggleFullscreen={() => setIsFullscreen((f) => !f)}
                onTocJump={handleTocJump}
              />
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Produce a stable, unique DOM id for a heading. Keeps CJK characters,
 * replaces whitespace runs with hyphens and strips punctuation, falling back
 * to a positional id when nothing remains (e.g. emoji-only headings).
 */
function slugifyHeading(
  text: string,
  index: number,
  seen: Map<string, number>,
): string {
  const base =
    text
      .toLowerCase()
      .replace(/[`*_~[\]()<>#:./\\|?!.,;"'。，、；：？！（）【】《》“”‘’]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "") || `section-${index + 1}`;
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

/**
 * Extract `##` headings from markdown content for the news "早报速览" overview.
 * Walks all `#`/`##`/`###` headings so index alignment matches the DOM-based
 * tocItems builder (which also iterates h1-h3), ensuring IDs are identical.
 * IDs are computed from the raw heading text — numbering prefix included —
 * because the rendered body headings keep it; the returned display text
 * strips a leading "N. " so the overview's own index column isn't doubled.
 */
function extractNewsOverview(content: string): { text: string; id: string }[] {
  const lines = content.split("\n");
  const all: { text: string; level: number }[] = [];
  let inCodeBlock = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    const m = line.match(/^(#{1,3})\s+(.+)/);
    if (m) all.push({ text: m[2].trim(), level: m[1].length });
  }
  const seen = new Map<string, number>();
  const result: { text: string; id: string }[] = [];
  for (let i = 0; i < all.length; i++) {
    const id = slugifyHeading(all[i].text, i, seen);
    if (all[i].level === 2)
      result.push({ text: all[i].text.replace(/^\d+\.\s+/, ""), id });
  }
  return result;
}

function DrawerContent({
  entry,
  state,
  docLocale,
  onDocLocaleChange,
  onClose,
  isFullscreen,
  isMobile,
  onToggleFullscreen,
  onTocJump,
}: {
  entry: KnowledgeEntry;
  state: LoadState;
  docLocale: DocLocale;
  onDocLocaleChange: (locale: DocLocale) => void;
  onClose: () => void;
  isFullscreen: boolean;
  isMobile: boolean;
  onToggleFullscreen: () => void;
  onTocJump: (id: string) => void;
}) {
  const { locale, t } = useI18n();
  const Icon = getCategoryIcon(entry.category);
  const status = STATUS_META[entry.status];
  const categoryLabel = getCategoryLabel(entry.category, locale);
  const statusLabel = getStatusLabel(entry.status, locale);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "failed">("idle");

  // Copy the original markdown content (from the pre-built entry data).
  const handleCopyOriginal = async () => {
    if (copyState === "copying") return;
    setCopyState("copying");
    try {
      await navigator.clipboard.writeText(entry.content || "");
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  // The actual locale served by the API (may differ from docLocale if the
  // zh-CN version doesn't exist — in that case the API returns "original").
  const servedLocale =
    state.kind === "success" ? state.usedLocale : docLocale;
  // Show a notice when the user requested Chinese but only the original is
  // available. Never shown for `zhOnly` entries: there the single source file
  // *is* the Chinese version, so falling back is not a downgrade.
  const showFallbackNotice =
    !entry.zhOnly &&
    state.kind === "success" &&
    docLocale === "zh-CN" &&
    state.usedLocale === "original";
  // Description follows the per-article doc locale (not the global UI locale),
  // so that "View Original" shows the English description and "View Chinese"
  // shows the Chinese description. `zhOnly` entries stay Chinese either way.
  const description = entry.zhOnly
    ? entry.descriptionZh || entry.description
    : docLocale === "zh-CN" && entry.descriptionZh
      ? entry.descriptionZh
      : entry.description;
  // Chinese-only entries have no "original vs. translation" distinction,
  // so the copy action is labelled as copying the source file.
  const copyLabel = entry.zhOnly
    ? t("drawer.copySource")
    : t("drawer.copyOriginal");

  // News (zhOnly) digests open with an H1 title + a metadata block (date /
  // audience / scope) + a thematic break before the first `##` section. Pull
  // that metadata out so it can be rendered as a distinct callout under the
  // copy-source button, instead of being duplicated in the header description
  // AND the markdown body. `leadBlock` is empty for non-news entries and for
  // news sources that don't match the shape.
  // The body itself keeps the original markdown untouched — including the
  // "1." / "2." numbering baked into the `##` headings. Only the 早报速览
  // overview strips that prefix, since it renders its own index column.
  const newsSplit =
    entry.zhOnly && state.kind === "success"
      ? splitNewsLeadBlock(state.content)
      : null;
  const leadBlock = newsSplit?.leadBlock ?? "";

  // Extract `##` headings for the news "早报速览" overview section. IDs are
  // derived from the raw heading text (numbering included) so they match the
  // DOM ids assigned to the rendered body headings; only the display text
  // strips the numbering prefix, since the overview renders its own index
  // column and a kept "1." would read as a duplicated "1. 1. …".
  const newsHeadings =
    entry.category === "news" && state.kind === "success"
      ? extractNewsOverview(newsSplit?.body ?? state.content)
      : [];

  return (
    <div
      style={{
        padding: isMobile ? 20 : 32,
        // On mobile the panel is fullscreen, so pad the top past the iOS
        // status bar / Dynamic Island and the bottom past the home indicator.
        paddingTop: isMobile
          ? "calc(20px + env(safe-area-inset-top))"
          : 32,
        paddingBottom: isMobile
          ? "calc(20px + env(safe-area-inset-bottom))"
          : 32,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 24 }}
      >
        <span className="hub-tag">{categoryLabel}</span>
        <div className="flex items-center" style={{ gap: 8 }}>
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="hub-theme-toggle"
            aria-label={
              isFullscreen ? t("drawer.exitFullscreen") : t("drawer.fullscreen")
            }
            title={
              isFullscreen ? t("drawer.exitFullscreen") : t("drawer.fullscreen")
            }
            style={{ width: 36 }}
          >
            {isFullscreen ? (
              <Minimize2 size={18} strokeWidth={2} />
            ) : (
              <Maximize2 size={18} strokeWidth={2} />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="hub-theme-toggle"
            aria-label={t("drawer.close")}
            style={{ width: 36 }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        className="inline-flex items-center"
        style={{ gap: 6, fontSize: 12, color: "var(--ink-3)" }}
      >
        <span
          className="hub-status-dot"
          style={{ background: status.color }}
          aria-hidden
        />
        {statusLabel}
      </div>

      <h2
        className="font-semibold"
        style={{
          color: "var(--ink)",
          fontSize: isMobile ? 22 : 26,
          lineHeight: 1.2,
          letterSpacing: "var(--tracking)",
          marginTop: 12,
        }}
      >
        {entry.title}
      </h2>

      {/* News digests render their metadata (date / audience / scope) as a
          dedicated callout under the copy-source button, so the header
          description is skipped for them to avoid duplication. */}
      {!leadBlock && (
        <p
          style={{
            marginTop: 12,
            color: "var(--ink-2)",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {description}
        </p>
      )}

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 6, marginTop: 16 }}>
          {entry.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--ink-3)",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                padding: "3px 8px",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 20,
          paddingTop: 14,
          paddingBottom: 14,
          borderTop: "1px solid var(--line)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--ink-3)",
        }}
      >
        <Row
          label={t("drawer.slug")}
          value={entry.slug}
          icon={<Icon size={13} strokeWidth={2} />}
        />
        {entry.tools && (
          <Row
            label={t("drawer.tools")}
            value={entry.tools}
            icon={<Wrench size={13} strokeWidth={2} />}
          />
        )}
        {entry.model && (
          <Row
            label={t("drawer.model")}
            value={entry.model}
            icon={<Cpu size={13} strokeWidth={2} />}
          />
        )}
        <Row
          label={t("drawer.updated")}
          value={entry.updatedAt}
          icon={<CalendarClock size={13} strokeWidth={2} />}
        />
      </div>

      {/* Per-article language toggle — only affects the document body.
          Independent from the top-nav UI locale. Chinese-only entries get a
          static badge instead, since there is nothing to switch between.
          News digests are always Chinese-only and have no copy action, so the
          entire row is hidden for them. */}
      {entry.category !== "news" && (
      <div
        className="flex items-center"
        style={{ gap: 8, marginTop: 20, marginBottom: 16 }}
      >
        {entry.zhOnly ? (
          <span
            className="inline-flex items-center"
            style={{
              height: 32,
              padding: "0 12px",
              gap: 6,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              border: "1px solid var(--line)",
              background: "var(--surface-2)",
              color: "var(--ink-3)",
            }}
          >
            <Languages size={14} strokeWidth={2} />
            {t("drawer.zhOnly")}
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onDocLocaleChange("original")}
              className="hub-ghost-btn"
              style={{
                height: 32,
                padding: "0 12px",
                fontSize: 12,
                gap: 6,
                borderColor:
                  servedLocale === "original" ? "var(--ink)" : "var(--line)",
                background:
                  servedLocale === "original"
                    ? "var(--surface-2)"
                    : "var(--surface)",
                color:
                  servedLocale === "original" ? "var(--ink)" : "var(--ink-3)",
              }}
              aria-pressed={servedLocale === "original"}
            >
              <FileText size={14} strokeWidth={2} />
              {t("drawer.original")}
            </button>
            <button
              type="button"
              onClick={() => onDocLocaleChange("zh-CN")}
              className="hub-ghost-btn"
              style={{
                height: 32,
                padding: "0 12px",
                fontSize: 12,
                gap: 6,
                borderColor:
                  servedLocale === "zh-CN" ? "var(--ink)" : "var(--line)",
                background:
                  servedLocale === "zh-CN"
                    ? "var(--surface-2)"
                    : "var(--surface)",
                color: servedLocale === "zh-CN" ? "var(--ink)" : "var(--ink-3)",
              }}
              aria-pressed={servedLocale === "zh-CN"}
            >
              <Languages size={14} strokeWidth={2} />
              {t("drawer.translated")}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={handleCopyOriginal}
          disabled={copyState === "copying"}
          className="hub-ghost-btn"
          style={{
            height: 32,
            padding: "0 12px",
            fontSize: 12,
            gap: 6,
            marginLeft: "auto",
            borderColor: "var(--line)",
            background: "var(--surface)",
            color: "var(--ink-3)",
          }}
          aria-label={copyLabel}
          title={copyLabel}
        >
          {copyState === "copying" ? (
            <Loader2 size={14} strokeWidth={2} className="animate-spin" />
          ) : copyState === "copied" ? (
            <Check size={14} strokeWidth={2} style={{ color: "var(--state-success, #22c55e)" }} />
          ) : copyState === "failed" ? (
            <X size={14} strokeWidth={2} style={{ color: "var(--state-error)" }} />
          ) : (
            <Copy size={14} strokeWidth={2} />
          )}
          {copyState === "copying"
            ? t("drawer.copying")
            : copyState === "copied"
              ? t("drawer.copied")
              : copyState === "failed"
                ? t("drawer.copyFailed")
                : copyLabel}
        </button>
      </div>
      )}

      {/* News digest metadata (date / audience / scope / retrieval notes)
          rendered as a distinct callout right under the copy-source button,
          before the body. Renders markdown so `**bold**` spans are preserved. */}
      {leadBlock && (
        <div
          className="hub-md-lead"
          style={{
            marginTop: 4,
            marginBottom: 20,
            padding: "12px 16px",
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderLeft: "2px solid var(--ink)",
          }}
        >
          <Markdown content={leadBlock} />
        </div>
      )}

      {/* 早报速览 — numbered list of all ## headings, shown only for news
          entries. Clicking an item scrolls to the corresponding section. */}
      {entry.category === "news" && newsHeadings.length > 0 && (
        <div className="hub-news-overview">
          <div className="hub-news-overview-title">早报速览</div>
          <ol className="hub-news-overview-list">
            {newsHeadings.map((h, i) => (
              <li key={h.id}>
                <button
                  type="button"
                  className="hub-news-overview-item"
                  onClick={() => onTocJump(h.id)}
                >
                  <span className="hub-news-overview-num">{i + 1}</span>
                  <span className="hub-news-overview-text">{h.text}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {showFallbackNotice && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            border: "1px solid var(--line)",
            background: "var(--surface-2)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--ink-3)",
          }}
        >
          {t("drawer.error", { message: "Chinese version not available" })}
        </div>
      )}

      <div>
        {state.kind === "success" && (
          <Markdown
            content={
              entry.zhOnly
                ? removeHorizontalRules(
                    newsSplit?.body ?? stripLeadingDocHeader(state.content),
                  )
                : stripLeadingDocHeader(state.content)
            }
          />
        )}

        {state.kind === "idle" && (
          <div
            className="flex items-center"
            style={{
              gap: 10,
              padding: "24px 0",
              color: "var(--ink-3)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
            }}
          >
            <FileText size={16} strokeWidth={2} />
            {t("drawer.idle")}
          </div>
        )}
      </div>

      <button
        type="button"
        className="hub-ghost-btn"
        style={{ marginTop: 24, width: "100%", justifyContent: "center" }}
        onClick={onClose}
      >
        {t("drawer.closeBtn")}
        <ChevronRight size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/**
 * The drawer header already renders the entry title + description, so the
 * markdown body must not repeat them. Strip a leading run of header-like
 * elements from the start of the document:
 *   1. one top-level H1 (the document title, optional leading emoji)
 *   2. an immediately-following blockquote (the description)
 *   3. an immediately-following thematic break (`---` / `***` / `___`)
 * This de-duplicates the body for sources that open with title + description
 * + separator (e.g. the news digests, and rules docs whose body
 * starts with `# <title>`). Documents that begin with `##` (agents/skills)
 * are untouched. The `raw=1` copy path is unaffected — it reads the source
 * directly and never passes through here.
 */
function stripLeadingDocHeader(content: string): string {
  const lines = content.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;

  // 1. top-level H1 (allow a leading emoji, e.g. "# 📡 Title")
  if (i < lines.length && /^#\s+\S/.test(lines[i])) {
    i++;
    while (i < lines.length && lines[i].trim() === "") i++;

    // 2. immediately-following blockquote
    if (i < lines.length && /^>\s?/.test(lines[i])) {
      while (i < lines.length && /^>\s?/.test(lines[i])) i++;
      while (i < lines.length && lines[i].trim() === "") i++;

      // 3. immediately-following thematic break
      if (i < lines.length && /^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i].trim())) {
        i++;
        while (i < lines.length && lines[i].trim() === "") i++;
      }
    }
  }

  return lines.slice(i).join("\n").replace(/^\n+/, "");
}

/**
 * Split a news (zhOnly) digest into its lead metadata block and the body.
 *
 * These digests open with:
 *   # <Title>
 *
 *   <metadata paragraph(s): date · audience · scope · retrieval notes>
 *
 *   ---
 *
 *   ## 1. First section
 *
 * The lead metadata is rendered as a distinct callout under the copy-source
 * button (see DrawerContent), so it must be separated from the body and must
 * NOT also appear in the markdown body (which is what caused the date /
 * audience line to render twice). Returns `{ leadBlock, body }` where
 * `leadBlock` is the raw markdown of the metadata paragraph(s) (empty when the
 * source doesn't match the shape) and `body` is everything after the trailing
 * thematic break — with the H1 stripped either way.
 */
function splitNewsLeadBlock(
  content: string,
): { leadBlock: string; body: string } {
  const lines = content.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;

  // No leading H1 → nothing to extract; leave content untouched.
  if (i >= lines.length || !/^#\s+\S/.test(lines[i])) {
    return { leadBlock: "", body: content };
  }
  i++; // consume H1
  while (i < lines.length && lines[i].trim() === "") i++;

  // Collect the metadata paragraph lines until a blank line, thematic break,
  // or heading.
  const leadLines: string[] = [];
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === "") break;
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) break;
    if (/^#{1,6}\s/.test(trimmed)) break;
    leadLines.push(lines[i]);
    i++;
  }
  while (i < lines.length && lines[i].trim() === "") i++;

  // Consume the trailing thematic break that delimits the lead from the body.
  if (
    i < lines.length &&
    /^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i].trim())
  ) {
    i++;
    while (i < lines.length && lines[i].trim() === "") i++;
  }

  const body = lines.slice(i).join("\n").replace(/^\n+/, "");
  return { leadBlock: leadLines.join("\n").trim(), body };
}

/**
 * Remove all standalone thematic-break lines (`---` / `***` / `___`) from the
 * body. Used for the news (zhOnly) entries, whose section
 * separation is already provided by the `##` heading top-borders — leaving
 * the original `---` rules in would render as redundant double lines.
 * Table separator rows (`|---|---|`) are NOT matched, since they contain `|`.
 */
function removeHorizontalRules(content: string): string {
  return content
    .split(/\r?\n/)
    .filter((line) => !/^(-{3,}|\*{3,}|_{3,})\s*$/.test((line ?? "").trim()))
    .join("\n");
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center" style={{ gap: 8, padding: "4px 0" }}>
      {icon}
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span
        style={{
          marginLeft: "auto",
          color: "var(--ink)",
          textAlign: "right",
          wordBreak: "break-all",
          maxWidth: "70%",
        }}
      >
        {value}
      </span>
    </div>
  );
}
