export type Locale = "en" | "zh";

/**
 * UI string catalog. Card content (title/description/tags/slug) is NOT
 * translated — only chrome (menus, labels, status, hints, buttons).
 *
 * Placeholders: {name} replaced via t(key, { name: value }).
 */
export const TRANSLATIONS = {
  en: {
    "brand.name": "Knowledge Hub",
    "nav.submit": "Submit",
    "nav.palette": "Command Palette (⌘K)",
    "nav.language": "Language",
    "nav.languageEn": "EN",
    "nav.languageZh": "中",

    "theme.toggle": "Toggle theme",
    "theme.toLight": "Switch to light",
    "theme.toDark": "Switch to dark",

    "hero.eyebrow": "AI · KNOWLEDGE · HUB",
    "hero.title": "Agent Knowledge Hub",
    "hero.subtitle":
      "A unified hub for discovering News, Agents, Rules & Skills across the AI engineering stack.",
    "hero.searchPlaceholder": "Search entries, keywords, or tags…",
    "hero.searchLabel": "Search the knowledge hub",
    "hero.total": "Total",

    "category.title": "Categories",
    "category.all": "All",
    "category.agents": "Agents",
    "category.rules": "Rules",
    "category.skills": "Skills",
    "category.news": "News",

    "news.allSources": "All Sources",
    "news.source": "Source",
    "news.allPeriods": "All Periods",
    "news.period": "Period",
    "news.period.daily": "Daily",
    "news.period.weekly": "Weekly",
    "news.period.monthly": "Monthly",

    "status.stable": "Stable",
    "status.recommended": "Recommended",
    "status.experimental": "Experimental",

    "card.updated": "Updated",
    "card.viewDetails": "View details for",

    "grid.empty": "No matching entries",
    "grid.emptyHint":
      'No results for "{query}". Try another category or clear the filter.',
    "grid.showMore": "Show more",
    "grid.remaining": "remaining",

    "palette.title": "Command palette",
    "palette.placeholder": "Search entries, categories, or tags…",
    "palette.search": "Search",
    "palette.empty": "Type to search the knowledge hub",
    "palette.noResults": 'No results for "{query}"',
    "palette.sectionCategories": "Categories",
    "palette.sectionEntries": "Entries",
    "palette.goToCategory": "Go to category",
    "palette.navigate": "↑↓ Navigate",
    "palette.select": "↵ Select",
    "palette.result": "result",
    "palette.results": "results",

    "drawer.close": "Close details",
    "drawer.loading": "Loading document…",
    "drawer.error": "Failed to load document: {message}",
    "drawer.idle": "Select an entry to view its document",
    "drawer.closeBtn": "Close",
    "drawer.slug": "Slug",
    "drawer.updated": "Updated",
    "drawer.tools": "Tools",
    "drawer.model": "Model",
    "drawer.viewOriginal": "View Original",
    "drawer.viewChinese": "View Chinese",
    "drawer.translated": "Chinese",
    "drawer.original": "Original",
    "drawer.copyOriginal": "Copy Original",
    "drawer.copying": "Copying…",
    "drawer.copied": "Copied!",
    "drawer.copyFailed": "Copy failed",
    "drawer.zhOnly": "This digest is published in Chinese only.",
    "drawer.copySource": "Copy Source",
    "drawer.fullscreen": "Enter fullscreen",
    "drawer.exitFullscreen": "Exit fullscreen",
    "drawer.toc": "On this page",
    "drawer.tocEmpty": "No headings in this document",

    "footer.tagline": "A curated entry hub for AI engineering practice.",
    "footer.resources": "Resources",
    "footer.about": "About",
    "footer.copyright": "© 2026 Knowledge Hub · Last updated 2026-07-30",
  },
  zh: {
    "brand.name": "知识库",
    "nav.submit": "提交条目",
    "nav.palette": "命令面板 (⌘K)",
    "nav.language": "语言",
    "nav.languageEn": "EN",
    "nav.languageZh": "中",

    "theme.toggle": "切换主题",
    "theme.toLight": "切换到亮色",
    "theme.toDark": "切换到暗色",

    "hero.eyebrow": "AI · 知识 · 库",
    "hero.title": "智能体知识库",
    "hero.subtitle": "一站式检索新闻、智能体、规则与技能等 AI 工程知识。",
    "hero.searchPlaceholder": "搜索条目、关键词或标签…",
    "hero.searchLabel": "搜索知识库",
    "hero.total": "总计",

    "category.title": "分类",
    "category.all": "全部",
    "category.agents": "智能体",
    "category.rules": "规则",
    "category.skills": "技能",
    "category.news": "新闻",

    "news.allSources": "全部来源",
    "news.source": "来源",
    "news.allPeriods": "全部周期",
    "news.period": "周期",
    "news.period.daily": "日报",
    "news.period.weekly": "周报",
    "news.period.monthly": "月报",

    "status.stable": "稳定",
    "status.recommended": "推荐",
    "status.experimental": "实验",

    "card.updated": "更新于",
    "card.viewDetails": "查看详情",

    "grid.empty": "未找到匹配的条目",
    "grid.emptyHint": "关键词「{query}」无结果，试试其他分类或清除筛选。",
    "grid.showMore": "展示更多",
    "grid.remaining": "剩余",

    "palette.title": "命令面板",
    "palette.placeholder": "搜索条目、分类或标签…",
    "palette.search": "搜索",
    "palette.empty": "输入关键词以搜索知识库",
    "palette.noResults": "无结果匹配「{query}」",
    "palette.sectionCategories": "分类",
    "palette.sectionEntries": "条目",
    "palette.goToCategory": "跳转到分类",
    "palette.navigate": "↑↓ 导航",
    "palette.select": "↵ 选择",
    "palette.result": "条结果",
    "palette.results": "条结果",

    "drawer.close": "关闭详情",
    "drawer.loading": "正在加载文档…",
    "drawer.error": "文档加载失败：{message}",
    "drawer.idle": "选择条目以查看文档",
    "drawer.closeBtn": "关闭",
    "drawer.slug": "标识",
    "drawer.updated": "更新",
    "drawer.tools": "工具",
    "drawer.model": "模型",
    "drawer.viewOriginal": "查看原文",
    "drawer.viewChinese": "查看中文",
    "drawer.translated": "中文",
    "drawer.original": "原文",
    "drawer.copyOriginal": "复制原文",
    "drawer.copying": "复制中…",
    "drawer.copied": "已复制！",
    "drawer.copyFailed": "复制失败",
    "drawer.zhOnly": "该资讯仅提供中文版本。",
    "drawer.copySource": "复制原文",
    "drawer.fullscreen": "进入全屏",
    "drawer.exitFullscreen": "退出全屏",
    "drawer.toc": "目录",
    "drawer.tocEmpty": "该文档没有可跳转的标题",

    "footer.tagline": "面向 AI 工程实践的条目库。",
    "footer.resources": "资源",
    "footer.about": "关于",
    "footer.copyright": "© 2026 知识库 · 最后更新 2026-07-30",
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS["en"];

/** Translate a key for a specific locale (server-safe, no React). */
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let s: string = TRANSLATIONS[locale][key] ?? key;
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.replace(`{${k}}`, String(vars[k]));
    }
  }
  return s;
}
