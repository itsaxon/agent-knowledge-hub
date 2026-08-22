/**
 * Client preferences (theme + locale).
 *
 * These are stored in cookies rather than localStorage so the *server* can
 * read them and emit the final `<html class="dark" data-locale="zh">` markup
 * on the first byte. That removes both the flash-of-wrong-theme and the
 * React hydration mismatch that a pre-hydration inline script would cause.
 */

export const THEME_COOKIE = "hub-theme";
export const LOCALE_COOKIE = "hub-locale";

/** One year, in seconds. */
const MAX_AGE = 60 * 60 * 24 * 365;

export type Theme = "light" | "dark";

export function normalizeTheme(value: string | undefined | null): Theme {
  return value === "dark" ? "dark" : "light";
}

/** Read a cookie in the browser. Returns null on the server or when unset. */
export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Persist a preference for a year on the current origin. */
export function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

/**
 * One-time migration for users whose preference still lives in localStorage
 * (the pre-cookie implementation). Returns the migrated value, or null when
 * there is nothing to migrate.
 */
export function migrateFromLocalStorage(
  key: string,
  isValid: (v: string) => boolean,
): string | null {
  if (typeof window === "undefined") return null;
  if (readCookie(key) !== null) return null;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved && isValid(saved)) {
      writeCookie(key, saved);
      window.localStorage.removeItem(key);
      return saved;
    }
  } catch {
    /* storage disabled — nothing to migrate */
  }
  return null;
}
