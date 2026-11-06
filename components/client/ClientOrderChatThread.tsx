import type { MessageRow, AttachmentRow } from "@/lib/client-communication";

type Appearance = { label: string; color: string; background: string; initials: string };
const COMPANY: Appearance = {
  label: "Evaryn Technologies Limited",
  color: "#2563EB",
  background: "rgba(37,99,235,0.08)",
  initials: "EV",
};
const CLIENT: Appearance = {
  label: "Client",
  color: "#0891B2",
  background: "rgba(8,145,178,0.08)",
  initials: "CL",
};
const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi",
});

/** The client-facing identity is always the company, never the individual employee. */
export default function ClientOrderChatThread({ messages, attachments }: {
  messages: MessageRow[];
  attachments: AttachmentRow[];
  isClientView?: boolean;
}) {
  return <div className="mt-4 space-y-3" aria-label="Order conversation">
    {messages.map(message => {
      const style = message.senderKind === "CLIENT" ? CLIENT : COMPANY;
      return <article key={message.id} className="rounded-2xl border border-[var(--ev-border)] bg-[var(--ev-surface)] p-4 shadow-sm dark:border-white/10">
        <div className="flex items-start gap-3">
          <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: style.color }}>
            {style.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="break-words text-sm font-bold">{style.label}</span>
              <time dateTime={new Date(message.createdAt).toISOString()} className="ml-auto text-xs opacity-65">
                {dateFormatter.format(new Date(message.createdAt))}
              </time>
            </div>
            <div className="mt-2 rounded-r-xl rounded-bl-xl border-l-[3px] px-3 py-3" style={{ borderLeftColor: style.color, backgroundColor: style.background }}>
              <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.body}</p>
            </div>
            {attachments.filter(attachment => attachment.messageId === message.id).map(attachment =>
              <a key={attachment.id} href={`/api/client-order-attachments/${attachment.id}`} className="mt-2 block break-all text-sm font-semibold text-cyan-700 underline dark:text-cyan-300">
                📎 {attachment.purpose === "FINAL" ? "Final file · " : "Attachment · "}{attachment.fileName}
              </a>
            )}
          </div>
        </div>
      </article>;
    })}
  </div>;
}
