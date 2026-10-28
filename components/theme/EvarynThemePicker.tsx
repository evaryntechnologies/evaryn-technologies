"use client";
import { useTheme } from "next-themes";
import { useEffect,useState } from "react";
export default function EvarynThemePicker(){
 const {theme,setTheme}=useTheme();const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 return <div className="fixed bottom-4 right-4 z-[90] rounded-xl border border-cyan-400/30 bg-[#071327]/95 p-1 text-white shadow-xl" aria-label="Appearance settings"><label className="sr-only" htmlFor="evaryn-theme">Theme</label><select id="evaryn-theme" aria-label="Theme" value={mounted?theme:"system"} onChange={e=>setTheme(e.target.value)} className="rounded-lg bg-transparent px-2 py-2 text-xs text-white outline-none"><option value="light" className="bg-[#071327]">☀ Light</option><option value="dark" className="bg-[#071327]">☾ Dark</option><option value="system" className="bg-[#071327]">System</option></select></div>;
}
