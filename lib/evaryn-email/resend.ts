import "server-only";

export const FROM = process.env.RESEND_FROM_EMAIL || "contact@evaryninc.com";
export const GMAIL = process.env.EVARYN_NOTIFICATION_EMAIL || "evaryntechnologies@gmail.com";

function key() {
  const value = process.env.RESEND_API_KEY;
  if (!value) throw new Error("RESEND_API_KEY missing");
  return value;
}

export async function received(id: string) {
  const r = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key()}` }, cache: "no-store",
  });
  if (!r.ok) throw new Error(`Resend incoming fetch failed: ${r.status}`);
  return await r.json() as {
    from: string; to: string[]; subject: string; text?: string | null;
    html?: string | null; attachments?: unknown[];
  };
}

export async function sendEmail(input: { to: string; subject: string; text: string; replyTo?: string; idempotencyKey?: string }) {
  const from = FROM;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
      ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: `Evaryn Technologies Limited <${from}>`,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
    cache: "no-store",
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Resend send failed ${r.status}: ${body.slice(0, 300)}`);
  }
  return await r.json() as { id: string };
}

export function mailboxAddress(raw: string) {
  const match = raw.match(/<([^<>]+)>/);
  const value = (match?.[1] || raw).trim();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) || value.includes("\r") || value.includes("\n")) {
    throw new Error("Invalid email address");
  }
  return value;
}

// Read recently received email metadata from Resend for manual recovery/synchronization.
export async function listReceivedEmails(limit = 100, after?: string) {
  const url = new URL("https://api.resend.com/emails/receiving");
  url.searchParams.set("limit", String(limit));
  if (after) url.searchParams.set("after", after);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${key()}` }, cache: "no-store",
  });
  if (!response.ok) throw new Error(`Resend inbox list failed: ${response.status}`);
  return response.json() as Promise<{
    data: { id: string; to: string[]; from: string; subject?: string; created_at?: string }[];
    has_more: boolean;
  }>;
}
