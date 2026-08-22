// scripts/finalize-dist.mjs
// Next.js static export always emits `out/`; this project ships the bundle
// under the conventional name `dist/`. Runs right after `next build` and
// renames the folder (replacing any stale dist from a previous build).
import { existsSync, rmSync, renameSync } from "node:fs";

if (existsSync("dist")) {
  rmSync("dist", { recursive: true, force: true });
}
if (!existsSync("out")) {
  console.error("[finalize-dist] out/ not found — did `next build` run?");
  process.exit(1);
}
renameSync("out", "dist");
console.log("[finalize-dist] out/ → dist/");
