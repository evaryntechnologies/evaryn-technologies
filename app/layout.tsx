import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://evaryn-technologies.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Evaryn Technologies Limited",
    template: "%s | Evaryn Technologies",
  },
  description:
    "Evaryn Technologies delivers LiDAR annotation, egocentric video collection, data annotation, content writing and video editing, quality-checked twice before delivery.",
  keywords: ["LiDAR annotation", "egocentric video collection", "AI training data", "data annotation", "content writing", "video editing", "Nairobi", "Kenya"],
  openGraph: {
    type: "website",
    siteName: "Evaryn Technologies Limited",
    title: "Evaryn Technologies: AI training data, content and video",
    description: "Quality-checked data, content and video, delivered without the rework.",
    images: ["/brand/evaryn-full-trimmed.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
