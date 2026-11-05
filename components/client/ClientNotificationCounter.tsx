"use client";
import { useEffect, useState } from "react";
export function ClientNotificationCounter({initial}: {initial:number}) {
  const [count, setCount] = useState(initial);
  useEffect(() => {
    let active = true;
    async function refresh() {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/client-notifications", {cache:"no-store"});
        if (response.ok) {
          const data: {unread?: number} = await response.json();
          if (active && typeof data.unread === "number") setCount(data.unread);
        }
      } catch { /* Retry on the next poll */ }
    }
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);
  if (!count) return null;
  return <span role="status" aria-label={`${count} unread client notifications`} className="flex min-w-5 items-center justify-center rounded-full bg-[#7956AF] px-1.5 py-0.5 text-xs font-bold text-white">{count > 99 ? "99+" : count}</span>;
}
