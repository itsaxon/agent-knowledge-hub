// scripts/build-entries.mjs
// Scans docs/{agents,rules,skills,news} and emits lib/entries.generated.json
// Run with: node scripts/build-entries.mjs

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, sep, basename, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DOCS = join(ROOT, "docs");
const OUT = join(ROOT, "lib", "entries.generated.json");

/** Minimal frontmatter parser — handles `---\n...\n---` blocks. */
function parseFrontmatter(text) {
  // Strip UTF-8 BOM if present (common on Windows-authored files).
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return { data: {}, body: text };
  const raw = fmMatch[1];
  const body = text.slice(fmMatch[0].length).replace(/^\r?\n/, "");
  const data = {};
  let key = null;
  let blockScalar = false; // true when collecting a multi-line block scalar
  let blockLines = [];
  for (const line of raw.split(/\r?\n/)) {
    // If we are collecting a block scalar (>- | etc.), gather indented lines.
    if (blockScalar) {
      if (/^\s{2,}/.test(line)) {
        blockLines.push(line.trim());
        continue;
      }
      // End of block scalar — flush collected lines.
      data[key] = blockLines.join(" ");
      blockScalar = false;
      blockLines = [];
      // Fall through to process the current line normally.
    }
    if (!line.trim()) continue;
    // naïve key: value (single-line only; arrays/objects kept as raw string)
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (m) {
      key = m[1];
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      // Detect YAML block scalar indicators (>- > |- | |+ >+)
      if (/^[>|][+-]?$/.test(val)) {
        blockScalar = true;
        blockLines = [];
        data[key] = ""; // placeholder, will be overwritten
      } else {
        data[key] = val;
      }
    } else if (key && line.startsWith("  - ")) {
      // list item
      const arr = Array.isArray(data[key]) ? data[key] : [];
      arr.push(line.slice(4).trim());
      data[key] = arr;
    }
  }
  // Flush any trailing block scalar at end of frontmatter.
  if (blockScalar && key) {
    data[key] = blockLines.join(" ");
  }
  return { data, body };
}

/** Extract a human title: frontmatter.name → first H1 → filename. */
function extractTitle(data, body, fallbackName) {
  if (data.name) return data.name;
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return fallbackName;
}

/** Extract description from frontmatter or first paragraph of body. */
function extractDescription(data, body) {
  if (data.description) return data.description;
  // Walk lines and grab the first "prose" line: skip headings, code fences,
  // list items, table rows, blockquotes, and frontmatter remnants.
  const lines = body.split(/\r?\n/);
  let inCode = false;
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    if (/^---/.test(l)) continue;
    if (/^```/.test(l)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    if (/^#{1,6}\s/.test(l)) continue; // headings
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) continue; // thematic break
    // blockquote (`> ...`) or list item (`- ` / `* ` / `+ `), possibly
    // indented. NOTE: must NOT match `**bold**` runs — a leading `*` is only
    // a list marker when followed by whitespace.
    if (/^(>\s?)|^\s*[-*+](\s|$)/.test(l)) continue;
    if (/^\d+\.\s/.test(l)) continue; // ordered list
    if (/^\|/.test(l)) continue; // table row
    // strip inline code & markdown emphasis for a cleaner preview
    const cleaned = l
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_~]/g, "")
      .slice(0, 180);
    return cleaned;
  }
  return "";
}

/** Infer tags: filename keywords + category. */
function inferTags(category, name) {
  const parts = name.split(/[-_/.]+/).filter(Boolean);
  const tags = new Set([category]);
  for (const p of parts) {
    if (p.length >= 3 && !["the", "and", "for", "with"].includes(p)) {
      tags.add(p.toLowerCase());
    }
  }
  return Array.from(tags).slice(0, 5);
}

/** Strip a leading emoji / pictograph plus following spaces from a title. */
function stripLeadingEmoji(text) {
  return text
    .replace(
      /^(?:[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uFE0F\u{1F000}-\u{1FAFF}]|\s)+/u,
      "",
    )
    .trim();
}

/** Pull a `YYYY-MM-DD` stamp out of a filename. Returns "" when absent. */
function extractDateFromName(name) {
  const m = name.match(/(\d{4})[-_.]?(\d{2})[-_.]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

/** Known period tiers under each news source folder. */
const NEWS_PERIODS = ["daily", "weekly", "monthly"];

/**
 * Classify a news digest's period from its filename. Used for backwards
 * compat (flat files directly in a source folder) and for unknown
 * subdirectories.
 */
function classifyNewsPeriod(fileName) {
  if (/^\d{4}-\d{2}-\d{2}/.test(fileName) || fileName.includes("日报"))
    return "daily";
  if (/^\d{4}-W\d{2}/i.test(fileName) || fileName.includes("周报"))
    return "weekly";
  if (/^\d{4}-M\d{2}/i.test(fileName) || fileName.includes("月报"))
    return "monthly";
  return "daily";
}

/**
 * Convert an ISO week token (e.g. `2026-W32`) to the Monday date of that
 * week (`YYYY-MM-DD`) so weekly digests sort correctly against dailies.
 * Returns "" when the name carries no week token.
 */
function extractWeekDateFromName(name) {
  const m = name.match(/(\d{4})-W(\d{2})/i);
  if (!m) return "";
  const year = Number(m[1]);
  const week = Number(m[2]);
  // ISO week 1 always contains Jan 4th.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7; // Mon=1 … Sun=7
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (dow - 1) + (week - 1) * 7);
  return week1Monday.toISOString().slice(0, 10);
}

/** Unique slug for a news entry: `<source>-<date>` / `<source>-<year>-w<nn>`. */
function newsSlug(sourceSlug, period, name) {
  if (period === "weekly") {
    const m = name.match(/(\d{4})-W(\d{2})/i);
    if (m) return `${sourceSlug}-${m[1]}-w${m[2]}`.toLowerCase();
  }
  const date = extractDateFromName(name);
  if (date) return `${sourceSlug}-${date}`;
  const flat = name
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return flat ? `${sourceSlug}-${flat}` : sourceSlug;
}

/**
 * Find the first news headline inside the "一、今日重大事件" section of a
 * daily digest. Section layout: `# 一、今日重大事件` followed by numbered
 * item headings (typically `## 1. <headline>`). Returns the first item
 * heading with its `N.` ordinal stripped, or "" when the section is absent.
 */
function extractTopNewsHeadline(body) {
  const lines = body.split(/\r?\n/);
  let inCode = false;
  let inSection = false;
  let sectionLevel = 0;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = line.match(/^(#{1,6})\s+(.+)/);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].trim();
    if (!inSection) {
      if (/^一、.*今日重大事件/.test(text)) {
        inSection = true;
        sectionLevel = level;
      }
      continue;
    }
    // A heading at the same/higher level ends the section without items.
    if (level <= sectionLevel) break;
    return text
      .replace(/^\d+[.、]\s*/, "")
      .replace(/[*_`]/g, "")
      .trim();
  }
  return "";
}

/**
 * Title for a daily digest: `今日早报：<top news>` where <top news> is the
 * first item under the "一、今日重大事件" section. Falls back to the
 * document's own title when the section (or its first item) is missing.
 */
function dailyNewsTitle(baseTitle, period, body) {
  if (period !== "daily") return baseTitle;
  const headline = extractTopNewsHeadline(body);
  return headline ? `今日早报：${headline}` : baseTitle;
}

/**
 * Description for a news digest: frontmatter → pre-`---` metadata block
 * → first blockquote line → generic prose scan.
 *
 * Most news digests put a metadata block (date, scope, sources, etc.) above
 * the first horizontal rule (`---`). We extract all prose lines from that
 * block as the description so the card preview shows the full context.
 */
function extractNewsDescription(data, body) {
  if (data.description) return data.description;
  const lines = body.split(/\r?\n/);

  // 1. If the body has a horizontal rule, extract all prose lines before it.
  const hrIndex = lines.findIndex((l) => /^---+\s*$/.test(l.trim()));
  if (hrIndex > 0) {
    const preLines = lines
      .slice(0, hrIndex)
      .map((l) => l.trim())
      .filter((l) => l && !/^#{1,6}\s/.test(l))
      .map((l) =>
        l
          .replace(/^>\s?/, "")
          .replace(/\*\*/g, "")
          .replace(/`([^`]+)`/g, "$1")
          .replace(/[*_~]/g, ""),
      );
    if (preLines.length > 0) {
      return preLines.join(" | ").slice(0, 300);
    }
  }

  // 2. Fallback: look for a blockquote (`> summary` callout).
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    if (/^#{1,6}\s/.test(l)) continue;
    if (/^---/.test(l)) continue;
    if (/^>\s?/.test(l)) {
      return l
        .replace(/^>\s?/, "")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/[*_~]/g, "")
        .slice(0, 180);
    }
    break;
  }
  return extractDescription(data, body);
}

/** Title-case a slug: "code-reviewer" → "Code Reviewer". */
function titleCase(slug) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Strip YAML frontmatter from markdown text, returning only the body. */
function stripFrontmatter(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

/**
 * Read the corresponding Chinese localized file and extract its description.
 * Tries multiple naming conventions in order:
 *   1. `<base>.zh-CN.md`  (project standard)
 *   2. `<base>_zh-CN.md`
 *   3. `<base>_zh.md`
 * Returns "" if no localized file exists or has no description.
 * @param {string} originalPath — absolute path to the original .md file.
 */
async function extractZhDescription(originalPath) {
  const candidates = [
    originalPath.replace(/\.md$/i, ".zh-CN.md"),
    originalPath.replace(/\.md$/i, "_zh-CN.md"),
    originalPath.replace(/\.md$/i, "_zh.md"),
  ];
  const zhPath = candidates.find((p) => existsSync(p));
  if (!zhPath) return "";
  try {
    const text = await readFile(zhPath, "utf8");
    const { data, body } = parseFrontmatter(text);
    return extractDescription(data, body);
  } catch {
    return "";
  }
}

/**
 * Find the Chinese localized file path for a given original .md file.
 * Returns the path if found, or null.
 */
function findZhFilePath(originalPath) {
  const candidates = [
    originalPath.replace(/\.md$/i, ".zh-CN.md"),
    originalPath.replace(/\.md$/i, "_zh-CN.md"),
    originalPath.replace(/\.md$/i, "_zh.md"),
  ];
  return candidates.find((p) => existsSync(p)) || null;
}

async function scanAgents() {
  const dir = join(DOCS, "agents");
  // Skip .zh-CN.md — those are localized versions, not independent entries.
  const files = (await readdir(dir)).filter(
    (f) => f.endsWith(".md") && !f.endsWith(".zh-CN.md"),
  );
  const out = [];
  for (const f of files) {
    const full = join(dir, f);
    const text = await readFile(full, "utf8");
    const { data, body } = parseFrontmatter(text);
    const name = basename(f, ".md");
    const descriptionZh = await extractZhDescription(full);
    const zhFilePath = findZhFilePath(full);
    out.push({
      id: `agents-${name}`,
      slug: name,
      category: "agents",
      title: titleCase(data.name || name),
      description: extractDescription(data, body),
      descriptionZh,
      content: stripFrontmatter(text),
      contentZh: zhFilePath ? stripFrontmatter(await readFile(zhFilePath, "utf8")) : "",
      status: "stable",
      updatedAt: "2026-07-30",
      tags: inferTags("agents", name),
      author: data.model ? `model:${data.model}` : "core-team",
      tools: data.tools || "",
      model: data.model || "",
      zhOnly: false,
      filePath: relative(ROOT, full).split(sep).join("/"),
      fileName: f,
      source: "",
    });
  }
  return out;
}

async function scanRules() {
  const dir = join(DOCS, "rules");
  const out = [];
  if (!existsSync(dir)) return out;

  // Walk top-level entries. Support both layouts:
  //   1. flat:   rules/<name>.md            → slug = <name>
  //   2. nested: rules/<lang>/<name>.md      → slug = <lang>-<name>
  const top = await readdir(dir);
  for (const entry of top) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const s = await stat(full);

    if (s.isFile() && entry.endsWith(".md") && !entry.endsWith(".zh-CN.md")) {
      // flat file
      const name = basename(entry, ".md");
      const text = await readFile(full, "utf8");
      const { data, body } = parseFrontmatter(text);
      const descriptionZh = await extractZhDescription(full);
      const zhFilePath = findZhFilePath(full);
      out.push({
        id: `rules-${name}`,
        slug: name,
        category: "rules",
        title: extractTitle(data, body, titleCase(name)),
        description: extractDescription(data, body),
        descriptionZh,
        content: stripFrontmatter(text),
        contentZh: zhFilePath ? stripFrontmatter(await readFile(zhFilePath, "utf8")) : "",
        status: "stable",
        updatedAt: "2026-07-30",
        tags: inferTags("rules", name),
        author: "rules-team",
        tools: data.tools || "",
        model: data.model || "",
        zhOnly: false,
        filePath: relative(ROOT, full).split(sep).join("/"),
        fileName: entry,
        source: "",
      });
    } else if (s.isDirectory()) {
      // nested: rules/<lang>/*.md
      const lang = entry;
      const langDir = full;
      const files = (await readdir(langDir)).filter(
        (f) => f.endsWith(".md") && !f.endsWith(".zh-CN.md"),
      );
      for (const f of files) {
        const fileFull = join(langDir, f);
        const text = await readFile(fileFull, "utf8");
        const { data, body } = parseFrontmatter(text);
        const name = `${lang}-${basename(f, ".md")}`;
        const descriptionZh = await extractZhDescription(fileFull);
        const zhFilePath = findZhFilePath(fileFull);
        out.push({
          id: `rules-${name}`,
          slug: name,
          category: "rules",
          title: `${titleCase(lang)} · ${titleCase(basename(f, ".md"))}`,
          description: extractDescription(data, body),
          descriptionZh,
          content: stripFrontmatter(text),
          contentZh: zhFilePath ? stripFrontmatter(await readFile(zhFilePath, "utf8")) : "",
          status: "stable",
          updatedAt: "2026-07-30",
          tags: inferTags("rules", `${lang}-${f}`),
          author: "rules-team",
          tools: data.tools || "",
          model: data.model || "",
          zhOnly: false,
          filePath: relative(ROOT, fileFull).split(sep).join("/"),
          fileName: f,
          source: "",
        });
      }
    }
  }
  return out;
}

async function scanSkills() {
  const dir = join(DOCS, "skills");
  const subdirs = (await readdir(dir)).filter((f) => !f.startsWith("."));
  const out = [];
  for (const sub of subdirs) {
    const subDir = join(dir, sub);
    if (!(await stat(subDir)).isDirectory()) continue;
    const skillFile = join(subDir, "SKILL.md");
    if (!existsSync(skillFile)) continue;
    const text = await readFile(skillFile, "utf8");
    const { data, body } = parseFrontmatter(text);
    const descriptionZh = await extractZhDescription(skillFile);
    const zhFilePath = findZhFilePath(skillFile);
    out.push({
      id: `skills-${sub}`,
      slug: sub,
      category: "skills",
      title: titleCase(data.name || sub),
      description: extractDescription(data, body),
      descriptionZh,
      content: stripFrontmatter(text),
      contentZh: zhFilePath ? stripFrontmatter(await readFile(zhFilePath, "utf8")) : "",
      status: "stable",
      updatedAt: "2026-07-30",
      tags: inferTags("skills", sub),
      author: data.metadata?.origin ? `origin:${data.metadata.origin}` : "skill-team",
      tools: data.tools || "",
      model: data.model || "",
      zhOnly: false,
      filePath: relative(ROOT, skillFile).split(sep).join("/"),
      fileName: "SKILL.md",
      source: "",
    });
  }
  return out;
}

/**
 * docs/news/<source>/<period>/*.md — AI tech-watch digests, grouped by
 * source and period.
 *
 * The news directory is organised into subfolders, one per source (e.g.
 * `QwenWork/`, `WorkBuddy/`). Each subfolder name becomes the entry's
 * `source` field, which the UI uses to render a secondary filter bar under
 * the News category. Inside each source folder, digests live in period
 * tiers — `daily/`, `weekly/`, `monthly/` — which populate the entry's
 * `period` field and drive a third-level filter in the UI. Flat `.md`
 * files directly in docs/news/ or in a source root are still accepted
 * (backwards compat); their period is inferred from the filename.
 *
 * These are Chinese-only source documents: there is no `.zh-CN.md` sibling
 * and no English original, so entries are flagged `zhOnly` and the UI always
 * renders the Chinese body regardless of the global locale. Chrome around
 * the card (category label, status, "updated") stays fully localized.
 */
async function scanNews() {
  const dir = join(DOCS, "news");
  const out = [];
  if (!existsSync(dir)) return out;

  /** Build one entry for a digest file. */
  async function pushEntry(fileFull, f, sourceName, sourceSlug, period) {
    const text = await readFile(fileFull, "utf8");
    const { data, body } = parseFrontmatter(text);
    const name = basename(f, ".md");
    const date =
      period === "weekly"
        ? extractWeekDateFromName(name)
        : extractDateFromName(name) || "";
    const slug = newsSlug(sourceSlug, period, name);
    // Daily digests get a branded headline title: "今日早报：<top news>"
    // where <top news> is the first item under "一、今日重大事件".
    const title = dailyNewsTitle(
      stripLeadingEmoji(extractTitle(data, body, titleCase(name))),
      period,
      body,
    );
    const description = extractNewsDescription(data, body);

    out.push({
      id: `news-${slug}`,
      slug,
      category: "news",
      title,
      description,
      descriptionZh: description,
      content: stripFrontmatter(text),
      contentZh: "",
      status: "recommended",
      updatedAt: date || new Date((await stat(fileFull)).mtime).toISOString().slice(0, 10),
      tags: ["news", "ai", sourceSlug, period, date].filter(Boolean),
      author: `news-${sourceSlug}`,
      tools: "",
      model: "",
      zhOnly: true,
      filePath: relative(ROOT, fileFull).split(sep).join("/"),
      fileName: f,
      source: sourceName,
      period,
    });
  }

  const toSlug = (name) =>
    name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

  const top = await readdir(dir);
  for (const entry of top) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const s = await stat(full);

    if (s.isDirectory()) {
      // docs/news/<source>/{daily,weekly,monthly}/*.md (flat files in the
      // source root are still accepted for backwards compat).
      const sourceName = entry;
      const sourceSlug = toSlug(sourceName) || "news";
      const sourceDir = full;
      for (const item of await readdir(sourceDir)) {
        if (item.startsWith(".")) continue;
        const itemFull = join(sourceDir, item);
        const st = await stat(itemFull);
        if (st.isDirectory()) {
          const period = NEWS_PERIODS.includes(item)
            ? item
            : "daily"; // unknown tier folders fall back to daily
          const files = (await readdir(itemFull)).filter(
            (f) => f.endsWith(".md") && !f.startsWith("."),
          );
          for (const f of files) {
            await pushEntry(join(itemFull, f), f, sourceName, sourceSlug, period);
          }
        } else if (st.isFile() && item.endsWith(".md")) {
          await pushEntry(itemFull, item, sourceName, sourceSlug, classifyNewsPeriod(item));
        }
      }
    } else if (s.isFile() && entry.endsWith(".md")) {
      // Flat file directly in docs/news/ (backwards compat).
      const text = await readFile(full, "utf8");
      const { data, body } = parseFrontmatter(text);
      const name = basename(entry, ".md");
      const period = classifyNewsPeriod(entry);
      const date =
        period === "weekly"
          ? extractWeekDateFromName(name)
          : extractDateFromName(name) || "";
      const slug = date
        ? `tech-watch-${date}`
        : name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() ||
          "tech-watch";
      const title = dailyNewsTitle(
        stripLeadingEmoji(extractTitle(data, body, titleCase(name))),
        period,
        body,
      );
      const description = extractNewsDescription(data, body);

      out.push({
        id: `news-${slug}`,
        slug,
        category: "news",
        title,
        description,
        descriptionZh: description,
        content: stripFrontmatter(text),
        contentZh: "",
        status: "recommended",
        updatedAt: date || new Date((await stat(full)).mtime).toISOString().slice(0, 10),
        tags: ["news", "ai", period, date].filter(Boolean),
        author: "news-team",
        tools: "",
        model: "",
        zhOnly: true,
        filePath: relative(ROOT, full).split(sep).join("/"),
        fileName: entry,
        source: "",
        period,
      });
    }
  }

  // Newest digest first.
  out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));

  // Deduplicate ids: if multiple files produce the same slug (e.g. two files
  // with the same date in the same source folder), append a counter suffix.
  const seen = new Map();
  for (const entry of out) {
    const n = (seen.get(entry.id) ?? 0) + 1;
    seen.set(entry.id, n);
    if (n > 1) {
      entry.id = `${entry.id}-${n}`;
      entry.slug = `${entry.slug}-${n}`;
    }
  }

  return out;
}

async function main() {
  if (!existsSync(DOCS)) {
    console.error(`[build-entries] docs dir not found: ${DOCS}`);
    process.exit(1);
  }
  const [agents, rules, skills, news] = await Promise.all([
    scanAgents(),
    scanRules(),
    scanSkills(),
    scanNews(),
  ]);
  const entries = [...agents, ...rules, ...skills, ...news];
  const payload = {
    generatedAt: new Date().toISOString(),
    total: entries.length,
    counts: {
      agents: agents.length,
      rules: rules.length,
      skills: skills.length,
      news: news.length,
      all: entries.length,
    },
    entries,
  };
  await writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log(
    `[build-entries] wrote ${entries.length} entries → ${relative(ROOT, OUT)}`,
  );
  console.log(
    `  agents=${agents.length} rules=${rules.length} skills=${skills.length} news=${news.length}`,
  );
}

/**
 * Build the full entries payload by scanning docs/{agents,rules,skills,news}.
 * Exported so the running server can re-scan at startup (dynamic content)
 * without going through the CLI / build step. Pure — does NOT write to disk.
 * @returns {{ generatedAt: string, total: number, counts: object, entries: object[] }}
 */
async function buildEntriesPayload() {
  const [agents, rules, skills, news] = await Promise.all([
    scanAgents(),
    scanRules(),
    scanSkills(),
    scanNews(),
  ]);
  const entries = [...agents, ...rules, ...skills, ...news];
  return {
    generatedAt: new Date().toISOString(),
    total: entries.length,
    counts: {
      agents: agents.length,
      rules: rules.length,
      skills: skills.length,
      news: news.length,
      all: entries.length,
    },
    entries,
  };
}

export {
  scanAgents,
  scanRules,
  scanSkills,
  scanNews,
  buildEntriesPayload,
  parseFrontmatter,
};

// Only run the CLI when this module is the entry point (i.e. invoked via
// `node scripts/build-entries.mjs`). When imported by the app's runtime data
// layer, `main()` must NOT execute (it would try to write the file and could
// call process.exit on error). `pathToFileURL` normalizes `process.argv[1]`
// so the comparison is correct across OS path styles (e.g. Windows `\`).
const isMainModule =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
