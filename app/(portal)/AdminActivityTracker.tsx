"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// The timer runs across the portal, not just on the Admin dashboard.
// Only the server can grant paid seconds; it enforces the ADMIN role.
export default function AdminActivityTracker() {
  const pathname = usePathname();
  const denied = useRef(false);
  useEffect(() => {
    if (!pathname || pathname.startsWith("/portal/login") || pathname.startsWith("/portal/register")) return;
    let lastInteraction = Date.now();
    const active = () => { lastInteraction = Date.now(); };
    const listeners: Array<keyof DocumentEventMap> = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"];
    listeners.forEach(name => document.addEventListener(name, active, { passive: true }));
    const ping = () => {
      if (denied.current) return;
      if (document.visibilityState !== "visible" || Date.now() - lastInteraction > 60_000) return;
      void fetch("/api/portal/admin/activity", { method: "POST", credentials: "same-origin", cache: "no-store" }).then(r=>{ if(r.status===403) denied.current=true; }).catch(() => {});
    };
    ping();
    const timer = window.setInterval(ping, 15_000);
    return () => { window.clearInterval(timer); listeners.forEach(name => document.removeEventListener(name, active)); };
  }, [pathname]);
  return null;
}
