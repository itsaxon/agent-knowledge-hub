"use client";

import { useEffect } from "react";

interface Options {
  /** Key combination without modifiers, e.g. "k". Case-insensitive. */
  key: string;
  /** Require meta (Cmd) on macOS, ctrl on others. Default true. */
  mod?: boolean;
  /** Require shift. Default false. */
  shift?: boolean;
  /** Ignore when focus is in a text field. Default true. */
  ignoreInputs?: boolean;
  handler: (e: KeyboardEvent) => void;
}

/**
 * Subscribe to a global key shortcut. Stable across re-renders;
 * the latest handler is always used.
 */
export function useHotkey({
  key,
  mod = true,
  shift = false,
  ignoreInputs = true,
  handler,
}: Options) {
  useEffect(() => {
    const lower = key.toLowerCase();
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isInput =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable === true;
      if (ignoreInputs && isInput && !(mod && lower === "k")) return;

      const modOk = mod ? e.metaKey || e.ctrlKey : true;
      const shiftOk = shift ? e.shiftKey : true;
      if (e.key.toLowerCase() === lower && modOk && shiftOk) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, mod, shift, ignoreInputs, handler]);
}
