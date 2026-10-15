import type { Metadata, Viewport } from "next";
import { Cascadia_Code, JetBrains_Mono, Geist_Mono, Geist, Inter } from "next/font/google";
import { SITE_NAME } from "@/tiles";
import { THEME_SCRIPT } from "@/theme";
import "./globals.css";

// Cascadia is the default; the rest are Theme Center options, so they're not
// preloaded (the browser only downloads a font once something uses it).
const cascadia = Cascadia_Code({
  subsets: ["latin"],
  variable: "--font-cascadia",
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: false, // no metrics for Cascadia in next/font
});
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", preload: false });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", preload: false });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", preload: false });
const fontVars = [cascadia, jetbrains, geistMono, geist, inter].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: "lawn",
  description: `${SITE_NAME}'s small patch of the internet`,
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#09090b", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The head script sets data-theme/data-font before hydration.
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
