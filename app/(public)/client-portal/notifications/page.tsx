import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CheckCheck,
  CircleCheck,
  ClipboardList,
  Inbox,
  MessageSquareText,
  PackageCheck,
} from "lucide-react";
import { ensureClientProfile } from "../../clients/actions";
import { listClientNotifications } from "@/lib/client-notifications";
import { openClientNotification, markClientNotificationsRead } from "./actions";
import "./notifications.css";

export const dynamic = "force-dynamic";

type NotificationKind = "message" | "request" | "progress" | "delivery";

function notificationKind(eventKey: string): NotificationKind {
  const prefix = eventKey.split(":", 1)[0];
  if (prefix === "message" || prefix === "request" || prefix === "progress" || prefix === "delivery") {
    return prefix;
  }
  return "request";
}

const kinds = {
  message: { label: "Message", Icon: MessageSquareText },
  request: { label: "Project update", Icon: ClipboardList },
  progress: { label: "Order progress", Icon: CircleCheck },
  delivery: { label: "Delivery", Icon: PackageCheck },
};

function dateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
    hour12: false,
  }).format(new Date(date));
}

export default async function ClientNotificationsPage() {
  const client = await ensureClientProfile();
  const items = await listClientNotifications(client.id, 100);
  const unread = items[0]?.unreadCount ?? 0;

  return (
    <main className="cp-notifications" aria-labelledby="client-notifications-title">
      <div className="cp-notifications-heading">
        <div className="cp-notifications-heading-copy">
          <Link href="/client-portal" className="cp-notifications-back">
            <ArrowLeft size={16} aria-hidden="true" /> Back to dashboard
          </Link>
          <div className="cp-notifications-title-row">
            <span className="cp-notifications-title-icon"><Bell size={24} aria-hidden="true" /></span>
            <div>
              <h1 id="client-notifications-title">Notifications</h1>
              <p>Messages, order progress, project updates and deliveries, all in one place.</p>
            </div>
          </div>
        </div>
        {unread > 0 ? (
          <form action={markClientNotificationsRead}>
            <button className="cp-notifications-mark-all" type="submit">
              <CheckCheck size={17} aria-hidden="true" /> Mark all as read
            </button>
          </form>
        ) : null}
      </div>

      <section className="cp-notifications-overview" aria-label="Notification summary">
        <div className="cp-notifications-overview-block">
          <span className="cp-notifications-overview-number">{unread}</span>
          <span className="cp-notifications-overview-label">Unread {unread === 1 ? "notification" : "notifications"}</span>
        </div>
        <div className="cp-notifications-overview-block cp-notifications-overview-total">
          <span className="cp-notifications-overview-number">{items.length}</span>
          <span className="cp-notifications-overview-label">Recent {items.length === 1 ? "update" : "updates"}</span>
        </div>
        <p className="cp-notifications-overview-note">Private to your client account · Newest first</p>
      </section>

      <section className="cp-notifications-feed" aria-label="Recent notifications">
        <div className="cp-notifications-feed-head">
          <h2>Recent activity</h2>
          <span>{unread ? `${unread} unread` : "All caught up"}</span>
        </div>
        {items.length === 0 ? (
          <div className="cp-notifications-empty">
            <span className="cp-notifications-empty-icon"><Inbox size={28} aria-hidden="true" /></span>
            <h3>You're all caught up</h3>
            <p>When your team sends a message, updates a project, or delivers an order, you'll see it here.</p>
            <Link href="/client-portal">Return to dashboard <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        ) : (
          <div className="cp-notifications-items">
            {items.map((item) => {
              const kind = notificationKind(item.eventKey);
              const { label, Icon } = kinds[kind];
              return (
                <form action={openClientNotification} key={item.eventKey} className="cp-notifications-form">
                  <input type="hidden" name="eventKey" value={item.eventKey} />
                  <button
                    type="submit"
                    className="cp-notifications-item"
                    data-kind={kind}
                    data-unread={!item.isRead}
                    aria-label={`${item.isRead ? "Read" : "Unread"} ${label}: ${item.title}. Open notification`}
                  >
                    <span className="cp-notifications-item-icon"><Icon size={21} aria-hidden="true" /></span>
                    <span className="cp-notifications-item-content">
                      <span className="cp-notifications-item-meta">
                        <span className="cp-notifications-type">{label}</span>
                        {!item.isRead && <span className="cp-notifications-new">New</span>}
                        <time dateTime={new Date(item.createdAt).toISOString()}>{dateLabel(item.createdAt)}</time>
                      </span>
                      <strong className="cp-notifications-item-title">{item.title}</strong>
                      <span className="cp-notifications-item-body">{item.body}</span>
                      <span className="cp-notifications-open">View update <ArrowUpRight size={14} aria-hidden="true" /></span>
                    </span>
                    <ArrowUpRight className="cp-notifications-end-icon" size={18} aria-hidden="true" />
                  </button>
                </form>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
