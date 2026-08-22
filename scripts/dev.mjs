#!/usr/bin/env node
/**
 * Dev-server wrapper that fixes the startup URLs printed by `next dev`.
 *
 * The project is deployed under the `/knowledge-hub` basePath (see
 * next.config.ts), but Next.js prints `http://localhost:3000` WITHOUT the
 * basePath, so opening the printed link lands on a 404. This wrapper spawns
 * the real dev server and rewrites every printed Local/Network URL to
 * include the basePath, so the links work exactly like production:
 *
 *   - Local:    http://localhost:3000/knowledge-hub
 *   - Network:  http://192.168.1.50:3000/knowledge-hub
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Read `basePath` from next.config.ts (falls back to "" when absent). */
function readBasePath() {
  try {
    const config = readFileSync(join(root, "next.config.ts"), "utf8");
    const match = config.match(/basePath\s*:\s*["'`]([^"'`]*)["'`]/);
    const value = match?.[1] ?? "";
    return value.startsWith("/") ? value : value ? `/${value}` : "";
  } catch {
    return "";
  }
}

const basePath = readBasePath();

/** Append the basePath to bare origin URLs (no path yet, not already prefixed).
 *  Only origins with an explicit port are touched — those are the Local and
 *  Network dev URLs; portless links (e.g. docs URLs in errors) stay intact. */
function rewriteUrls(text) {
  if (!basePath) return text;
  return text.replace(
    /(https?:\/\/[A-Za-z0-9._-]+:\d+)((?:\/[^\s]*)?)/g,
    (full, origin, path) => {
      if (path && path !== "/") return full; // already has a path
      return `${origin}${basePath}`;
    },
  );
}

const child = spawn(
  process.execPath,
  [join(root, "node_modules", "next", "dist", "bin", "next"), "dev"],
  { cwd: root, env: process.env },
);

child.stdout.on("data", (chunk) =>
  process.stdout.write(rewriteUrls(chunk.toString())),
);
child.stderr.on("data", (chunk) =>
  process.stderr.write(rewriteUrls(chunk.toString())),
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
