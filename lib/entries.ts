// lib/entries.ts
// Static data source for the knowledge-hub entries.
//
// All markdown content is pre-built into `entries.generated.json` by
// `scripts/build-entries.mjs` (runs automatically via `prebuild` / `predev`).
// This module simply imports that JSON — no `node:fs`, no runtime scanning.
// Safe for static export (`output: "export"`).

import generatedData from "./entries.generated.json";
import type { CategoryId, KnowledgeEntry } from "./data";

const entries: KnowledgeEntry[] = (generatedData.entries as any[]).map((e) => ({
  ...e,
  detail: e.description,
}));

export async function getEntries(): Promise<KnowledgeEntry[]> {
  return entries;
}

export async function getEntryById(id: string): Promise<KnowledgeEntry | undefined> {
  return entries.find((e) => e.id === id);
}

export async function getCategoryCounts(): Promise<Record<CategoryId | "all", number>> {
  return generatedData.counts as Record<CategoryId | "all", number>;
}
