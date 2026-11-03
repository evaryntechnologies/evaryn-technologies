// Group by subject and the outside correspondent. No database migration required.
export type EmailConversationItem = {
  id: string; direction: string; fromAddress: string; toAddress: string;
  subject: string; receivedAt: Date; isRead?: boolean; forwardStatus?: string;
  body?: string; lastForwardError?: string | null; attachmentInfo?: unknown;
  replyToId?: string | null;
};
const companyAddress = "contact@evaryninc.com";
export function normalizedSubject(subject: string): string {
  let value = (subject || "(No subject)").trim();
  // Remove multiple RE/FW prefixes, including those introduced by email clients.
  while (/^(re|fw|fwd)\s*:/i.test(value)) value = value.replace(/^(re|fw|fwd)\s*:\s*/i, "").trim();
  return value.toLowerCase() || "(no subject)";
}
export function externalAddress(mail: EmailConversationItem): string {
  return (mail.fromAddress.toLowerCase() === companyAddress
    ? mail.toAddress : mail.fromAddress).trim().toLowerCase();
}
export function conversationKey(mail: EmailConversationItem): string {
  return JSON.stringify([externalAddress(mail), normalizedSubject(mail.subject)]);
}
export function groupEmailConversations<T extends EmailConversationItem>(mails: T[]) {
  const groups = new Map<string, T[]>();
  for (const mail of mails) {
    const key = conversationKey(mail);
    const group = groups.get(key) || [];
    group.push(mail);
    groups.set(key, group);
  }
  return [...groups.values()].map(messages => {
    messages.sort((a,b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
    const unreadCount = messages.filter(m => m.direction === "INBOUND" && !m.isRead).length;
    return { messages, latest: messages[messages.length - 1], count: messages.length,
      unreadCount, unread: unreadCount > 0 };
  }).sort((a,b) => Number(b.unreadCount > 0) - Number(a.unreadCount > 0) ||
    new Date(b.latest.receivedAt).getTime() - new Date(a.latest.receivedAt).getTime());
}
