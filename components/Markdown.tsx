"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

/**
 * Markdown renderer tuned for the 21st monochrome style:
 * 0 radius, ink-colored headings, bordered code blocks & tables.
 */
function MarkdownImpl({ content }: Props) {
  return (
    <div className="hub-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "var(--ink)",
                margin: "24px 0 12px",
                lineHeight: 1.3,
                letterSpacing: "var(--tracking)",
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: "var(--ink)",
                margin: "20px 0 10px",
                paddingTop: 12,
                borderTop: "1px solid var(--line)",
                letterSpacing: "var(--tracking)",
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink)",
                margin: "16px 0 8px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono)",
              }}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--ink-2)",
                margin: "8px 0",
              }}
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul
              style={{
                margin: "8px 0",
                paddingLeft: 20,
                color: "var(--ink-2)",
                fontSize: 14,
                lineHeight: 1.7,
                listStyle: "none",
              }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              style={{
                margin: "8px 0",
                paddingLeft: 20,
                color: "var(--ink-2)",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => {
            const ordered = (props as { ordered?: boolean }).ordered;
            return (
              <li
                style={{
                  margin: "4px 0",
                  position: "relative",
                  paddingLeft: ordered ? 0 : 4,
                }}
              >
                {!ordered && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: -14,
                      top: 0,
                      color: "var(--ink-3)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ▸
                  </span>
                )}
                {children}
              </li>
            );
          },
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "var(--ink)",
                textDecoration: "underline",
                textDecorationThickness: 1,
                textUnderlineOffset: 3,
                borderBottom: "1px solid var(--ink-3)",
              }}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong
              style={{ color: "var(--ink)", fontWeight: 600 }}
            >
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em style={{ color: "var(--ink-2)", fontStyle: "italic" }}>
              {children}
            </em>
          ),
          code: ({ children, className }) => {
            const isBlock = /language-/.test(className ?? "");
            if (isBlock) {
              return (
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "var(--ink)",
                    display: "block",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: "var(--ink)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  padding: "1px 6px",
                }}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                boxShadow: "var(--shadow-1)",
                padding: 14,
                margin: "12px 0",
                overflowX: "auto",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: "12px 0",
                paddingLeft: 14,
                borderLeft: "2px solid var(--ink)",
                color: "var(--ink-2)",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--line)",
                margin: "20px 0",
              }}
            />
          ),
          table: ({ children }) => (
            <div style={{ overflowX: "auto", margin: "12px 0" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  border: "1px solid var(--line)",
                  boxShadow: "var(--shadow-1)",
                }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ background: "var(--surface-2)" }}>{children}</thead>
          ),
          th: ({ children }) => (
            <th
              style={{
                textAlign: "left",
                padding: "8px 12px",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontSize: 11,
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: "8px 12px",
                border: "1px solid var(--line)",
                color: "var(--ink-2)",
                verticalAlign: "top",
              }}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const Markdown = memo(MarkdownImpl);
