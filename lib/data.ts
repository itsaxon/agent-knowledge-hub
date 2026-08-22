import type { LucideIcon } from "lucide-react";
import { Bot, ScrollText, Sparkles, LayoutGrid, Radar } from "lucide-react";
import { translate, type Locale, type TranslationKey } from "./i18n";

export type CategoryId = "agents" | "rules" | "skills" | "news";

export type Status = "stable" | "recommended" | "experimental";

/** News-only: publishing cadence tier (folder under each news source). */
export type NewsPeriod = "daily" | "weekly" | "monthly";

export interface Category {
  id: CategoryId | "all";
  icon: LucideIcon;
  /** i18n key for this category's label. */
  labelKey: TranslationKey;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: CategoryId;
  description: string;
  /** Chinese description extracted from .zh-CN.md frontmatter. Empty if no
      localized version exists. */
  descriptionZh: string;
  /** Short summary shown in drawer before markdown loads / as fallback. */
  detail: string;
  slug: string;
  status: Status;
  updatedAt: string;
  tags: string[];
  author: string;
  /** Comma-separated tool list from frontmatter (e.g. "Read, Grep, Glob"). */
  tools: string;
  /** Model identifier from frontmatter (e.g. "opus"). */
  model: string;
  /**
   * The source document exists in Chinese only (no English original and no
   * `.zh-CN.md` sibling). The document body and its description are always
   * rendered in Chinese, whatever the global UI locale is; the surrounding
   * chrome (category label, status, meta labels) stays fully localized.
   */
  zhOnly: boolean;
  /** Markdown body (frontmatter stripped) of the original source file. */
  content: string;
  /** Markdown body (frontmatter stripped) of the Chinese localized file. Empty if none. */
  contentZh: string;
  /** Repo-relative path to the source markdown file. */
  filePath: string;
  fileName: string;
  /**
   * News-only: the subfolder name under docs/news/ that this digest belongs to
   * (e.g. "Qwen", "WorkBuddy"). Empty string for non-news entries and for
   * flat news files that sit directly in docs/news/ (backwards compat).
   */
  source: string;
  /**
   * News-only: the period tier this digest belongs to — `daily` / `weekly` /
   * `monthly` (folder under each source, e.g. `docs/news/QwenWork/daily/`).
   * Empty string for non-news entries.
   */
  period: NewsPeriod | "";
}

/**
 * Categories — News / Agents / Rules / Skills (mapped to docs/).
 * Labels are translated via i18n; card content stays untranslated.
 */
export const CATEGORIES: Category[] = [
  { id: "all", icon: LayoutGrid, labelKey: "category.all" },
  { id: "news", icon: Radar, labelKey: "category.news" },
  { id: "agents", icon: Bot, labelKey: "category.agents" },
  { id: "rules", icon: ScrollText, labelKey: "category.rules" },
  { id: "skills", icon: Sparkles, labelKey: "category.skills" },
];

/** Map status id → i18n key. */
export const STATUS_LABEL_KEY: Record<Status, TranslationKey> = {
  stable: "status.stable",
  recommended: "status.recommended",
  experimental: "status.experimental",
};

/** Map news period id → i18n key. */
export const NEWS_PERIOD_LABEL_KEY: Record<NewsPeriod, TranslationKey> = {
  daily: "news.period.daily",
  weekly: "news.period.weekly",
  monthly: "news.period.monthly",
};

/** Visual style per status (color is locale-independent). */
export const STATUS_META: Record<
  Status,
  { color: string; kind: "success" | "info" | "warning" }
> = {
  stable: { color: "var(--state-success)", kind: "success" },
  recommended: { color: "var(--state-info)", kind: "info" },
  experimental: { color: "var(--state-warning)", kind: "warning" },
};

/**
 * Description to show for an entry under the given locale.
 * `zhOnly` entries ignore the locale and always return the Chinese text.
 */
export function getEntryDescription(
  entry: Pick<KnowledgeEntry, "description" | "descriptionZh" | "zhOnly">,
  locale: Locale,
): string {
  if (entry.zhOnly) return entry.descriptionZh || entry.description;
  return locale === "zh" && entry.descriptionZh
    ? entry.descriptionZh
    : entry.description;
}

export function getCategoryIcon(id: CategoryId): LucideIcon {
  return CATEGORIES.find((c) => c.id === id)?.icon ?? Sparkles;
}

/** Localized category label. */
export function getCategoryLabel(id: CategoryId, locale: Locale): string {
  const cat = CATEGORIES.find((c) => c.id === id);
  return cat ? translate(locale, cat.labelKey) : id;
}

/** Localized status label. */
export function getStatusLabel(status: Status, locale: Locale): string {
  return translate(locale, STATUS_LABEL_KEY[status]);
}

/** Localized news period label. */
export function getNewsPeriodLabel(
  period: NewsPeriod,
  locale: Locale,
): string {
  return translate(locale, NEWS_PERIOD_LABEL_KEY[period]);
}
