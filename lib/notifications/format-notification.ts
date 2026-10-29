/**
 * Presentation-only formatting for notification titles and messages.
 * Keep persisted machine identifiers untouched for routing, audits and permissions.
 */
const labels: Record<string, string> = {
  ADMIN_TIME: "Admin tracked hours",
  SUPER_ADMIN: "Super Administrator",
  TASKER: "Tasker",
  REVIEWER: "Reviewer",
  QA: "Quality Assurance",
  PENDING_QA: "Awaiting quality assurance",
  PENDING_REVIEW: "Awaiting review",
  IN_PROGRESS: "In progress",
  IN_REVISION: "In revision",
  REVISION_REQUIRED: "Revision required",
  CHANGES_REQUESTED: "Changes requested",
  COMPLETED: "Completed",
  CANCELLED: "Canceled",
  CANCELED: "Canceled",
  DELIVERED_AWAITING_CLIENT: "Delivered, awaiting client response",
  PENDING_APPROVAL: "Awaiting approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SHORTLISTED: "Shortlisted",
  HIRED: "Hired",
  NEW: "New",
  IN_DISCUSSION: "In discussion",
  PAYMENT_METHOD: "Payment method",
  PAYMENT_CHANGE_REQUEST: "Payment method change request",
  FORCE_REASSIGNED: "Reassigned by management",
  REASSIGNED_TASK: "Reassigned task",
  REASSIGNED: "Reassigned",
  TASK_SUBMISSION: "Task submission",
  TASK_REVIEW: "Task review",
  QA_REVIEW: "Quality assurance review",
  ACCOUNT_SUSPENDED: "Account suspended",
  PASSWORD_RESET: "Password reset",
  ACCESS_CODE: "Access code",
  EMPLOYEE_PROFILE: "Employee profile",
  PAYOUT_PENDING: "Awaiting payment",
  PAYOUT_PAID: "Paid",
};

// Only uppercase machine-style tokens are converted. Ordinary text, usernames,
// IDs, references, amounts and links remain as stored.
const machineToken = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g;

export function formatNotificationText(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(machineToken, (token) => {
    if (labels[token]) return labels[token];
    // Do not infer meanings for arbitrary technical codes or identifiers.
    return token;
  });
}
