"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

const subscribe = () => () => {};

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div
        className="h-10 w-32 rounded-xl border border-slate-200 dark:border-slate-700"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-[#101f39]">
      {theme === "light" ? (
        <Sun size={16} aria-hidden="true" />
      ) : theme === "dark" ? (
        <Moon size={16} aria-hidden="true" />
      ) : (
        <Monitor size={16} aria-hidden="true" />
      )}

      <select
        aria-label="Website appearance"
        value={theme ?? "system"}
        onChange={(event) => setTheme(event.target.value)}
        className="h-10 min-w-20 cursor-pointer bg-transparent text-sm text-[#071327] outline-none dark:text-white"
      >
        <option value="light" className="text-slate-900">
          Light
        </option>
        <option value="dark" className="text-slate-900">
          Dark
        </option>
        <option value="system" className="text-slate-900">
          System
        </option>
      </select>
    </div>
  );
}
