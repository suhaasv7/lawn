import type { Metadata } from "next";
import { Cascadia_Code } from "next/font/google";
import { SITE_NAME } from "@/tiles";
import "./globals.css";

const cascadia = Cascadia_Code({
  subsets: ["latin"],
  variable: "--font-cascadia",
  fallback: ["Courier New", "monospace"],
  adjustFontFallback: false, // no metrics for Cascadia in next/font
});

export const metadata: Metadata = {
  title: "lawn",
  description: `${SITE_NAME}'s small patch of the internet`,
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cascadia.variable}>
      <body>{children}</body>
    </html>
  );
}
