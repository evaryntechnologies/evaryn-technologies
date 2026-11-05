"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const types = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/png", "image/jpeg"];
const MAX_FILE = 10 * 1024 * 1024;
const BUCKET = "evaryn-private-uploads";

export default function OrderMessageComposer({requestId, staff=false}:{requestId:string;staff?:boolean}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [purpose, setPurpose] = useState<"UPDATE"|"FINAL">("UPDATE");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!text.trim()) { setError("Include a short message describing your files or update."); return; }
    if (files.length > 3 || files.some(f => f.size < 1 || f.size > MAX_FILE || !types.includes(f.type))) {
      setError("You may attach up to 3 PDF, DOCX, XLSX, TXT, PNG or JPG files (10 MB each).");return;
    }
    setBusy(true);setError("");setInfo("Preparing secure message...");
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
      const grantIds:string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setInfo(`Uploading attachment ${i+1} of ${files.length}...`);
        const preparation = await fetch("/api/client-message-uploads",{
          method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
          body:JSON.stringify({requestId,fileName:file.name,contentType:file.type,fileSize:file.size,purpose})
        });
        const grant = await preparation.json();
        if (!preparation.ok) throw new Error(grant.error || "Cannot prepare upload");
        const {error:uploadError} = await supabase.storage.from(BUCKET).uploadToSignedUrl(grant.path,grant.token,file,{contentType:file.type});
        if (uploadError) throw new Error(`Could not upload ${file.name}`);
        grantIds.push(grant.grantId);
      }
      setInfo("Sending message...");
      const res = await fetch("/api/client-order-messages",{
        method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
        body:JSON.stringify({requestId,message:text.trim(),grantIds})
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Could not send message");
      setText("");setFiles([]);setInfo("Message sent successfully.");
      const fileInput = document.getElementById(`message-files-${requestId}`) as HTMLInputElement|null;
      if (fileInput) fileInput.value = "";
      router.refresh();
    } catch(e) {
      setInfo("");setError(e instanceof Error ? e.message : "Unable to send message");
    } finally {setBusy(false);}
  }
  return <form onSubmit={submit} className="mt-6 grid gap-3 rounded-2xl border border-sky-400/20 bg-sky-100/10 p-4 dark:bg-[#102b4a]/40">
    <label className="grid gap-2 text-sm font-semibold">{staff?"Reply or send a progress update":"Send a message about your order"}
      <textarea required maxLength={5000} rows={4} value={text} onChange={e=>setText(e.target.value)} placeholder="Describe your update or the attached files..." className="w-full rounded-xl border border-sky-400/30 bg-white/95 p-3 text-[#103D70] outline-none focus:ring-2 focus:ring-[#7956AF]" />
    </label>
    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="grid gap-1 text-sm font-semibold">Attach files (optional)
        <input id={`message-files-${requestId}`} type="file" multiple accept=".pdf,.txt,.docx,.xlsx,.png,.jpg,.jpeg" disabled={busy}
          onChange={e=>setFiles(Array.from(e.target.files||[]))} className="max-w-full rounded-lg border border-sky-400/25 p-2 text-sm" />
      </label>
      <label className="grid gap-1 text-sm font-semibold">Attachment purpose
        <select value={purpose} onChange={e=>setPurpose(e.target.value as "UPDATE"|"FINAL")} disabled={busy} className="rounded-lg border border-sky-400/25 bg-white p-2.5 text-[#103D70]">
          <option value="UPDATE">Progress update / instructions</option>
          <option value="FINAL">Final copies / deliverables</option>
        </select>
      </label>
    </div>
    <p className="text-xs opacity-75">Up to 3 files per message, 10 MB each. PDF, Word, Excel, text and images. Files are private and available only to this order's client and authorized Evaryn staff.</p>
    {files.length>0&&<p className="text-xs opacity-80">Selected: {files.map(f=>f.name).join(", ")}</p>}
    {error&&<p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-300">{error}</p>}
    {info&&<p role="status" className="text-sm text-cyan-700 dark:text-cyan-200">{info}</p>}
    <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#7956AF] px-5 py-3 font-semibold text-white hover:bg-[#69469d] disabled:opacity-60 sm:w-max">{busy?"Sending...":"Send message"}</button>
  </form>;
}
