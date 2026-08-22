# Agent Knowledge Hub

<p align="center">
  <b>English</b> | <a href="#中文">中文</a>
</p>

A knowledge base portal for AI agent resources — browse, search, and explore curated agents, rules, skills, and the daily AI tech watch in a modern web UI.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI:** React 19, Framer Motion, Lucide Icons, Geist Font
- **Markdown:** react-markdown + remark-gfm

## Project Structure

```text
├── app/                  # Next.js App Router pages & API routes
│   ├── api/entry/        # API route for fetching entry markdown content
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page (search, category rail, card grid)
│   └── globals.css       # Global styles
├── components/           # React components
├── docs/                 # Knowledge base content (markdown source)
│   ├── agents/           # Agent definitions
│   ├── rules/            # Coding rules & conventions
│   ├── skills/           # Skill documents
│   └── news/             # Daily AI tech-watch digests (Chinese only)
├── hooks/                # Custom React hooks
├── lib/                  # Data layer, i18n, utilities
├── scripts/              # Build scripts
│   └── build-entries.mjs # Scans docs/ and generates lib/entries.generated.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will automatically run the `build-entries` script (via `predev`) to scan `docs/` and generate the search index, then start the Next.js dev server at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

### Rebuild Search Index Only

If you add or modify markdown files in `docs/`, regenerate the index without restarting the dev server:

```bash
npm run build:entries
```

## Features

- Full-text search across all knowledge entries
- Category filtering (Agents / Rules / Skills / Tech Watch)
- Command palette (`Ctrl+K` / `Cmd+K`) for quick navigation
- Detail drawer with rendered markdown content and copy-to-clipboard functionality
- Internationalization (English / Chinese) — category names, statuses and all card chrome are translated
- Dark / Light theme toggle (both preferences are cookie-backed and server-rendered, so there is no flash and no hydration mismatch)
- Responsive layout with paginated card grid

## Adding Content

Place your markdown files in the appropriate `docs/` subdirectory:

- `docs/agents/` — Agent prompt definitions
- `docs/rules/` — Coding rules and conventions
- `docs/skills/<skill-name>/SKILL.md` — Skill documents
- `docs/news/` — Daily tech-watch digests, e.g. `今日AI科技观察-2026-07-31.md`

Each file supports YAML frontmatter for metadata (name, description, tools, model, tags). After adding files, run `npm run build:entries` to update the index.

For `docs/agents|rules|skills`, an optional `<name>.zh-CN.md` sibling provides the Chinese translation. `docs/news` works differently: the digest is Chinese-only, so its card and document body always render in Chinese regardless of the UI language, and the drawer hides the original/translation switch. The date in the filename (`YYYY-MM-DD`) drives the entry slug, the "updated" stamp and the newest-first ordering; the leading `> …` blockquote is used as the card summary.

## License

See [LICENSE](./LICENSE) for details.

---

# 中文

<p align="center">
  <a href="#agent-knowledge-hub">English</a> | <b>中文</b>
</p>

一个面向 AI 智能体资源的知识库门户 —— 在现代 Web UI 中浏览、搜索和探索精选的智能体、规则、技能以及每日 AI 科技观察。

## 技术栈

- **框架:** Next.js 16 (App Router)
- **语言:** TypeScript
- **样式:** Tailwind CSS 4
- **UI:** React 19, Framer Motion, Lucide Icons, Geist 字体
- **Markdown:** react-markdown + remark-gfm

## 项目结构

```text
├── app/                  # Next.js App Router 页面与 API 路由
│   ├── api/entry/        # 获取条目 Markdown 内容的 API 路由
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 主页 (搜索、分类侧边栏、卡片网格)
│   └── globals.css       # 全局样式
├── components/           # React 组件
├── docs/                 # 知识库内容 (Markdown 源码)
│   ├── agents/           # 智能体定义
│   ├── rules/            # 编码规则与规范
│   ├── skills/           # 技能文档
│   └── news/             # 每日 AI 科技观察摘要 (仅中文)
├── hooks/                # 自定义 React Hooks
├── lib/                  # 数据层、国际化 (i18n)、工具函数
├── scripts/              # 构建脚本
│   └── build-entries.mjs # 扫描 docs/ 并生成 lib/entries.generated.json
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 18

### 安装

```bash
npm install
```

### 开发

```bash
npm run dev
```

这将自动运行 `build-entries` 脚本（通过 `predev`）来扫描 `docs/` 并生成搜索索引，然后启动 Next.js 开发服务器，访问 [http://localhost:3000](http://localhost:3000)。

### 生产构建

```bash
npm run build
npm start
```

### 仅重建搜索索引

如果你在 `docs/` 中添加或修改了 Markdown 文件，无需重启开发服务器即可重新生成索引：

```bash
npm run build:entries
```

## 功能特性

- 跨所有知识条目的全文搜索
- 分类筛选 (智能体 / 规则 / 技能 / 科技观察)
- 命令面板 (`Ctrl+K` / `Cmd+K`) 快速导航
- 详情抽屉，支持渲染 Markdown 内容和一键复制功能
- 国际化 (英文 / 中文) — 分类名称、状态及所有卡片 UI 均已翻译
- 深色 / 浅色主题切换 (偏好设置基于 Cookie 并由服务端渲染，无闪烁且无 hydration 不匹配问题)
- 响应式布局与分页卡片网格

## 添加内容

将你的 Markdown 文件放入对应的 `docs/` 子目录中：

- `docs/agents/` — 智能体提示词定义
- `docs/rules/` — 编码规则与规范
- `docs/skills/<skill-name>/SKILL.md` — 技能文档
- `docs/news/` — 每日科技观察摘要，例如 `今日AI科技观察-2026-07-31.md`

每个文件支持使用 YAML frontmatter 来定义元数据（name, description, tools, model, tags）。添加文件后，运行 `npm run build:entries` 以更新索引。

对于 `docs/agents|rules|skills`，可以通过提供一个同级的 `<name>.zh-CN.md` 文件作为中文翻译。`docs/news` 的机制不同：摘要仅提供中文，因此无论 UI 语言如何，其卡片和文档正文始终以中文渲染，并且抽屉中会隐藏原文/翻译切换按钮。文件名中的日期 (`YYYY-MM-DD`) 决定了条目的 slug、"更新于" 时间戳以及按时间倒序的排序；开头的 `> …` 引用块将被用作卡片摘要。

## 许可证

详情请参阅 [LICENSE](./LICENSE)。
