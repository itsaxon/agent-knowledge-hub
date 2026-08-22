"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  THEME_COOKIE,
  migrateFromLocalStorage,
  writeCookie,
  type Theme,
} from "@/lib/prefs";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface Props {
  children: React.ReactNode;
  /**
   * Theme resolved on the server from the `hub-theme` cookie. The server
   * already applied the matching class to <html>, so the first client render
   * must start from the exact same value — otherwise React reports a
   * hydration mismatch.
   */
  initialTheme?: Theme;
}

export function ThemeProvider({ children, initialTheme = "light" }: Props) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const apply = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    writeCookie(THEME_COOKIE, next);
  }, []);

  // One-time migration for visitors whose theme is still in localStorage.
  // Runs after hydration, so it can never cause a mismatch.
  useEffect(() => {
    const migrated = migrateFromLocalStorage(
      THEME_COOKIE,
      (v) => v === "light" || v === "dark",
    );
    if (migrated === "light" || migrated === "dark") apply(migrated);
  }, [apply]);

  const toggle = useCallback(() => {
    apply(theme === "dark" ? "light" : "dark");
  }, [apply, theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, toggle, setTheme: apply }),
    [apply, theme, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
