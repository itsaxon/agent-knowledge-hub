---
name: business-tech-news
description: >-
  Read and summarize today's or recent noteworthy business and technology news.
  Use when the user asks for latest news, tech news, business news, market updates,
  industry trends, startup news, AI news, financial news, or wants to know what is
  happening in the business and technology world. Supports different time ranges
  (today, this week, recent) and can focus on specific topics or provide broad coverage.
---

# Business & Tech News Reader

Aggregate and summarize noteworthy business and technology news from reputable sources.

## Workflow

### 1. Determine Scope

Parse the user request to identify:

- **Time range**: today, this week, recent (default: today)
- **Topics**: AI/ML, startups, finance, markets, crypto, enterprise tech, consumer tech, or broad coverage
- **Depth**: headlines only, brief summaries, or detailed analysis

### 2. Search for News

Use web search or the in-app browser to find recent news from these priority sources:

**Tech News**

- TechCrunch, The Verge, Ars Technica, Wired, MIT Technology Review
- Hacker News top stories
- Product Hunt launches
- GitHub trending repositories

**Business & Finance**

- Bloomberg, Reuters, Wall Street Journal, Financial Times
- CNBC, Business Insider, Forbes
- Y Combinator blog, startup funding announcements

**AI & Emerging Tech**

- OpenAI blog, Anthropic blog, Google DeepMind blog
- arXiv papers with high citation or attention
- AI product launches and research breakthroughs

### 3. Aggregate and Rank

Collect 10-15 stories and rank by:

1. **Significance**: Major funding rounds, product launches, policy changes, market movements
2. **Recency**: Prioritize stories from the specified time range
3. **Breadth**: Ensure diverse topic coverage unless user requests specific focus
4. **Engagement**: Stories with high discussion activity (Hacker News, Reddit, social media)

### 4. Present News

Format the output as:

`
## [Time Range] Business & Tech News

### Top Stories

**[Headline]** — [Source]
[2-3 sentence summary: what happened, why it matters, key numbers/facts]

### [Category] (e.g., AI & Machine Learning)

**[Headline]** — [Source]
[1-2 sentence summary]

---

Key Takeaways:
- [3-5 bullet points highlighting major trends or patterns]
`

### 5. Categorization

Use these categories and adapt based on news volume:

- AI & Machine Learning
- Funding & Startups
- Markets & Finance
- Enterprise & SaaS
- Consumer Tech
- Cybersecurity & Privacy
- Policy & Regulation
- Product Launches
- Research & Science

## Search Strategy

### For Today

Use these search queries:

`
tech news today
business news today
AI news today
startup funding [current date]
site:techcrunch.com [current date]
site:theverge.com [current date]
`

### For This Week

`
top tech stories this week
business news weekly roundup
most important tech news [current week]
Hacker News top stories past 7 days
`

### For Specific Topics

Tailor searches to the user interest:

- **AI**: model releases, research papers, product launches
- **Startups**: funding rounds, acquisitions, YC batches
- **Markets**: stock movements, earnings, economic indicators
- **Crypto**: price movements, protocol updates, regulatory news

## Quality Standards

- **Accuracy**: Cross-reference major stories across multiple sources
- **Recency**: Verify publication dates match the requested time range
- **Objectivity**: Present facts without editorial bias
- **Attribution**: Always cite sources with links when available
- **Significance**: Prioritize stories with real business or industry impact

## Behavior Notes

- When news is slow, reduce story count rather than padding with low-significance items
- For major breaking stories, provide deeper context and multiple source perspectives
- Include a "Why it matters" note for significant developments
- Flag stories with ongoing developments or follow-up expected
- If the user requests a specific language (e.g., Chinese), present the news in that language

## Example Interactions

**User**: "What is happening in tech today?"
Search for today top tech stories, present 10-12 stories across categories with brief summaries.

**User**: "Give me this week AI news"
Focus on AI-specific sources, present 8-10 stories about model releases, research, and product launches.

**User**: "Any major startup funding recently?"
Search Crunchbase, TechCrunch, and VC blogs for funding announcements, present with amounts and valuations.

**User**: "Quick tech headlines"
Present 15-20 headlines with source attribution, no summaries.

**User**: "今天有什么科技新闻？"
Search and present today tech news in Chinese, covering global and China-specific stories.
