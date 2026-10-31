"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

const subscribe = () => () => {};

const options = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

/**
 * Three-way appearance toggle with a sliding highlight.
 * Light = airy cyan-blue, Dark = deep logo blue, System = follow the device.
 */
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const active = mounted ? (theme ?? "system") : "system";
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === active)
  );

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="relative inline-grid h-10 grid-cols-3 items-center rounded-full border border-[var(--ev-border)] bg-[var(--ev-surface)] p-1 shadow-inner"
    >
      {/* sliding highlight */}
      <span
        aria-hidden="true"
        className="absolute left-1 top-1 h-8 w-8 rounded-full bg-[var(--ev-primary)] shadow-md transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(${index * 100}%)`, opacity: mounted ? 1 : 0 }}
      />
      {options.map(({ value, label, Icon }) => {
        const selected = mounted && active === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label} appearance`}
            title={label}
            onClick={() => setTheme(value)}
            className={`relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
              selected
                ? "text-[var(--ev-on-primary)]"
                : "text-[var(--ev-muted)] hover:text-[var(--ev-ink)]"
            }`}
          >
            <Icon size={15} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
