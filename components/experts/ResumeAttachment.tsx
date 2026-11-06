"use client";

import { useState, type ChangeEvent } from "react";

export default function ResumeAttachment() {
  const [key, setKey] = useState("");
  const [state, setState] = useState<"idle" | "uploading" | "ready" | "error">("idle");
  const [note, setNote] = useState("PDF or DOCX, maximum 3 MB.");
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setKey("");
    if (!file) { setState("idle"); return; }
    if (file.size > 3 * 1024 * 1024 || !/\.(pdf|docx)$/i.test(file.name)) {
      setNote("Choose a PDF or DOCX résumé up to 3 MB."); setState("error"); return;
    }
    setState("uploading"); setNote("Uploading your résumé securely…");
    try {
      const form = new FormData(); form.append("file", file);
      const res = await fetch("/api/experts/resume", { method: "POST", body: form, credentials: "same-origin" });
      const payload = await res.json();
      if (!res.ok || !payload.key) throw new Error(payload.error || "Upload failed.");
      setKey(payload.key); setState("ready"); setNote(`${file.name} — uploaded securely`);
    } catch (error) {
      setState("error"); setNote(error instanceof Error ? error.message : "Upload failed.");
    }
  }
  return <div className="rounded-2xl border border-[#95CBE6] bg-[#E8F5FC] p-5 text-[#123865] dark:border-[#3C6486] dark:bg-[#142F50] dark:text-white">
    <label htmlFor="expert-resume" className="block text-sm font-bold">Attach your résumé / CV <span className="text-[#7956AF] dark:text-[#D5B8FB]">(required)</span></label>
    <p className="mt-1 text-xs opacity-80">Your résumé is private and available only to authorized Evaryn recruitment reviewers.</p>
    <input id="expert-resume" aria-describedby="expert-resume-status" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={upload} required className="mt-3 block w-full rounded-xl border border-[#B4DDF0] bg-white p-3 text-sm text-[#123865] file:mr-4 file:rounded-lg file:border-0 file:bg-[#7956AF] file:px-4 file:py-2 file:font-semibold file:text-white dark:bg-[#1E4268] dark:text-white"/>
    <input type="hidden" name="resumeStorageKey" value={key}/>
    <p id="expert-resume-status" role="status" className={`mt-2 text-sm ${state === "error" ? "text-red-700 dark:text-red-200" : "text-[#315D80] dark:text-sky-200"}`}>{note}</p>
    {state === "uploading" && <p className="mt-2 text-xs">Do not submit until the upload is complete.</p>}
  </div>;
}
