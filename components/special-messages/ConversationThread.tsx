"use client";

import { useState } from "react";
import { CornerUpLeft, Send, X } from "lucide-react";
import { replyToSpecialMessage } from "@/app/(portal)/special-messages/actions";

export type ConversationMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  fullName: string;
  role: string;
  quotedId: string | null;
  quotedBody: string | null;
  quotedName: string | null;
  quotedRole: string | null;
};

const roleColors: Record<string, { color: string; background: string; label: string }> = {
  SUPER_ADMIN: { color: "#EF4444", background: "rgba(239,68,68,.075)", label: "Super Admin" },
  ADMIN: { color: "#8B5CF6", background: "rgba(139,92,246,.075)", label: "Admin" },
  QA: { color: "#2563EB", background: "rgba(37,99,235,.075)", label: "QA" },
  REVIEWER: { color: "#0891B2", background: "rgba(8,145,178,.075)", label: "Reviewer" },
  TASKER: { color: "#16A34A", background: "rgba(22,163,74,.075)", label: "Tasker" },
  WORKER: { color: "#16A34A", background: "rgba(22,163,74,.075)", label: "Worker" },
};

function roleStyle(role: string) {
  return roleColors[role.toUpperCase()] ?? { color: "#64748B", background: "rgba(100,116,139,.075)", label: role.replaceAll("_", " ") };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(new Date(value));
}

export default function ConversationThread({ conversationId, currentEmployeeId, messages, isGeneral }: {
  conversationId: string;
  currentEmployeeId: string;
  messages: ConversationMessage[];
  isGeneral: boolean;
}) {
  const [reply, setReply] = useState<ConversationMessage | null>(null);
  const [body, setBody] = useState("");
  const audience = isGeneral ? "everyone in General Chat" : "everyone in this conversation";

  return <div className="space-y-5">
    <section aria-label="Conversation messages" className="space-y-3">
      {messages.map(message => {
        const sender = roleStyle(message.role);
        const quoted = roleStyle(message.quotedRole ?? "");
        const initials = message.fullName.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? "").join("").toUpperCase();
        return <article id={`message-${message.id}`} key={message.id} className="scroll-mt-24 rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-4 shadow-sm transition-colors target:ring-2 target:ring-[#0891B2] sm:p-5">
          <div className="flex items-start gap-3">
            <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: sender.color }}>{initials || "?"}</div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="break-words text-sm font-bold">{message.fullName}</span>
                <span className="rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: sender.color }}>{sender.label}</span>
                {message.senderId === currentEmployeeId && <span className="text-xs text-[var(--ev-muted)]">You</span>}
                <time className="ml-auto text-xs text-[var(--ev-muted)]" dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
              </div>
              <div className="rounded-r-xl rounded-bl-xl border-l-[3px] p-3 sm:p-4" style={{ borderLeftColor: sender.color, backgroundColor: sender.background }}>
                {message.quotedId && <a href={`#message-${message.quotedId}`} className="mb-3 block rounded-lg border-l-[3px] bg-[var(--ev-surface)] p-3 transition hover:opacity-80" style={{ borderLeftColor: quoted.color }} title="Jump to original message">
                  <span className="block text-xs font-bold" style={{ color: quoted.color }}>{message.quotedName ?? "Employee"} · {quoted.label}</span>
                  <span className="mt-1 block max-h-20 overflow-hidden whitespace-pre-wrap break-words text-xs text-[var(--ev-muted)]">{message.quotedBody ?? "Original message unavailable"}</span>
                </a>}
                <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.body}</p>
              </div>
              <button type="button" onClick={() => { setReply(message); document.getElementById("special-message-composer")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[var(--ev-muted)] hover:bg-[var(--ev-surface-2)] hover:text-[var(--ev-ink)]" aria-label={`Reply to ${message.fullName}`}><CornerUpLeft size={15}/>Reply</button>
            </div>
          </div>
        </article>;
      })}
    </section>
    <section id="special-message-composer" className="scroll-mt-20 rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-5 sm:p-7">
      <h2 className="font-bold">{reply ? `Replying to ${reply.fullName}` : "Reply to all"}</h2>
      <p className="mt-1 text-xs text-[var(--ev-muted)]">Your message is visible to {audience}.</p>
      {reply && <div className="mt-4 flex items-start gap-3 rounded-xl bg-[var(--ev-surface-2)] p-3" style={{ borderLeft: `3px solid ${roleStyle(reply.role).color}` }}>
        <div className="min-w-0 flex-1"><p className="text-xs font-bold" style={{ color: roleStyle(reply.role).color }}>{reply.fullName} · {roleStyle(reply.role).label}</p><p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-xs text-[var(--ev-muted)]">{reply.body}</p></div>
        <button type="button" aria-label="Cancel quoted reply" onClick={() => setReply(null)} className="rounded-lg p-1 hover:bg-[var(--ev-surface)]"><X size={17}/></button>
      </div>}
      <form action={replyToSpecialMessage} className="mt-4 space-y-3">
        <input type="hidden" name="conversationId" value={conversationId}/>
        <input type="hidden" name="replyToMessageId" value={reply?.id ?? ""}/>
        <textarea name="body" required maxLength={6000} rows={4} value={body} onChange={event => setBody(event.target.value)} placeholder={reply ? "Write your reply..." : "Write a message..."} className="w-full rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface-2)] p-4 text-sm leading-7"/>
        <button disabled={!body.trim()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#7956AF] px-6 py-3 font-semibold text-white transition hover:bg-[#68479E] disabled:cursor-not-allowed disabled:opacity-50"><Send size={17}/>{reply ? "Send quoted reply" : "Reply to all"}</button>
      </form>
    </section>
  </div>;
}
