"use client";

import { Square } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { useI18n } from "@/lib/i18n-context";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer
      id="footer"
      style={{
        borderTop: "1px solid var(--line)",
        paddingTop: 48,
        paddingBottom: "calc(48px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="hub-container hub-pad-x">
        <div
          className="hub-footer-grid grid"
          style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}
        >
          <div>
            <div className="flex items-center" style={{ gap: 10 }}>
              <Square
                size={18}
                strokeWidth={2.5}
                style={{ color: "var(--ink)" }}
              />
              <span
                className="font-semibold"
                style={{ color: "var(--ink)", fontSize: 15 }}
              >
                {t("brand.name")}
              </span>
            </div>
            <p style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 13 }}>
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <div className="hub-rail-label" style={{ marginBottom: 12 }}>
              {t("footer.resources")}
            </div>
            <ul className="flex flex-col" style={{ gap: 8, fontSize: 14 }}>
              {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                <li key={c.id}>
                  <a
                    href="#card-grid"
                    className="hub-foot-link"
                    style={{ color: "var(--ink-2)" }}
                  >
                    {t(c.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="hub-rail-label" style={{ marginBottom: 12 }}>
              {t("footer.about")}
            </div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--ink-2)",
              }}
            >
              v1.0.0 · 2026
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: "1px solid var(--line)",
            fontSize: 13,
            color: "var(--ink-3)",
          }}
        >
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
