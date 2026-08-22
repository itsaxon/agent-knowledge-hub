"use client";

import { useEffect, useState } from "react";

export const MOBILE_BREAKPOINT = 768;

/**
 * SSR-safe mobile detection.
 *
 * Returns `false` during SSR and the first client render so the markup the
 * server ships matches the initial hydration pass (avoiding React hydration
 * mismatches). After mount it tracks `window.matchMedia` so the value stays
 * correct across orientation changes / viewport resizing on iOS Safari.
 *
 * `maxWidth` defaults to 768px (Tailwind's `md`), matching the breakpoint
 * where the desktop sidebar hides and the mobile chip rail takes over.
 */
export function useIsMobile(maxWidth: number = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${maxWidth - 1}px)`);
    const update = () => setIsMobile(mql.matches);
    update();
    // Safari < 14 only supports the legacy addListener API.
    if (mql.addEventListener) {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, [maxWidth]);

  return isMobile;
}
