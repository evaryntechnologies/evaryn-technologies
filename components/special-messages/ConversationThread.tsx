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

  return <div className="evx-stack" style={{ gap: 20 }}>
    <section aria-label="Conversation messages" className="evx-stack" style={{ gap: 18 }}>
      {messages.map(message => {
        const sender = roleStyle(message.role);
        const quoted = roleStyle(message.quotedRole ?? "");
        const initials = message.fullName.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? "").join("").toUpperCase();
        const mine = message.senderId === currentEmployeeId;
        return <article id={`message-${message.id}`} key={message.id} className="evx-bubble" style={{ scrollMarginTop: 96, ["--t" as string]: sender.color }}>
          <div className="evx-bubble-head">
            <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 999, background: sender.color, color: "#fff", fontSize: 11, fontWeight: 700 }}>{initials || "?"}</span>
            <strong>{message.fullName}</strong>
            <span className="evx-pill evx-pill-plain" style={{ ["--t" as string]: sender.color }}>{sender.label}</span>
            {mine && <span className="evx-meta">You</span>}
            <time className="evx-meta" style={{ marginLeft: "auto" }} dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
          </div>
          <div className="evx-bubble-body">
            {message.quotedId && <a href={`#message-${message.quotedId}`} title="Jump to original message" style={{ display: "block", marginBottom: 10, padding: "8px 12px", borderLeft: `3px solid ${quoted.color}`, borderRadius: 8, background: "var(--ev-surface)", textDecoration: "none", color: "inherit" }}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: quoted.color }}>{message.quotedName ?? "Employee"} · {quoted.label}</span>
              <span className="evx-meta" style={{ display: "block", marginTop: 2, maxHeight: 54, overflow: "hidden", whiteSpace: "pre-wrap" }}>{message.quotedBody ?? "Original message unavailable"}</span>
            </a>}
            {message.body}
          </div>
          <div>
            <button type="button" onClick={() => { setReply(message); document.getElementById("special-message-composer")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="evx-btn evx-btn-ghost evx-btn-sm" style={{ border: 0, background: "transparent", color: "var(--ev-muted)" }} aria-label={`Reply to ${message.fullName}`}><CornerUpLeft size={14} aria-hidden="true"/>Reply</button>
          </div>
        </article>;
      })}
    </section>
    <section id="special-message-composer" className="evx-composer" style={{ scrollMarginTop: 80 }}>
      <div><h2 className="evx-section-title">{reply ? `Replying to ${reply.fullName}` : "Reply to all"}</h2><p className="evx-meta">Your message is visible to {audience}.</p></div>
      {reply && <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 12px", borderRadius: 10, background: "var(--ev-inset)", borderLeft: `3px solid ${roleStyle(reply.role).color}` }}>
        <div style={{ minWidth: 0, flex: 1 }}><p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: roleStyle(reply.role).color }}>{reply.fullName} · {roleStyle(reply.role).label}</p><p className="evx-meta" style={{ marginTop: 2, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "pre-wrap" }}>{reply.body}</p></div>
        <button type="button" aria-label="Cancel quoted reply" onClick={() => setReply(null)} className="evx-btn evx-btn-ghost evx-btn-sm" style={{ padding: 6, minHeight: 0 }}><X size={16}/></button>
      </div>}
      <form action={replyToSpecialMessage} className="evx-form">
        <input type="hidden" name="conversationId" value={conversationId}/>
        <input type="hidden" name="replyToMessageId" value={reply?.id ?? ""}/>
        <textarea name="body" required maxLength={6000} rows={4} value={body} onChange={event => setBody(event.target.value)} placeholder={reply ? "Write your reply…" : "Write a message…"} className="evx-textarea"/>
        <div><button disabled={!body.trim()} className="evx-btn evx-btn-violet"><Send size={16} aria-hidden="true"/>{reply ? "Send quoted reply" : "Reply to all"}</button></div>
      </form>
    </section>
  </div>;
}
