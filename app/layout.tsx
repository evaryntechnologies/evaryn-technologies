import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import EvarynThemePicker from "@/components/theme/EvarynThemePicker";

export const metadata: Metadata = {
  title: {
    default: "Evaryn Technologies Limited",
    template: "%s | Evaryn Technologies",
  },
  description:
    "Innovation. People. Progress. Professional writing, data annotation and video editing solutions.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}<EvarynThemePicker /></ThemeProvider>
      </body>
    </html>
  );
}
