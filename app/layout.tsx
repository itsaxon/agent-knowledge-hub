import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/components/I18nProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Knowledge Hub · AI Engineering Catalog",
  description:
    "A unified hub for discovering News, Agents, Rules & Skills across the AI engineering stack.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `cover` extends the web view into the notch / Dynamic Island area so
  // `env(safe-area-inset-*)` can be used to pad interactive elements away
  // from it. Critical for iOS (iPhone X+ and iOS 26).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d4d4d4" },
    { media: "(prefers-color-scheme: dark)", color: "#242424" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Static export cannot read cookies on the server side.
  // ThemeProvider and I18nProvider will restore real preferences from
  // cookies on the client after hydration.
  return (
    <html
      lang="en"
      data-locale="en"
      className={GeistMono.variable}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider initialTheme="light">
          <I18nProvider initialLocale="en">{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
