# Evaryn integration package — 28 October 2026

This is an incremental patch built against the latest source ZIP provided in the conversation (2026-10-28 04:29), not against the user's live GitHub checkout. Do not overwrite newer modified files without comparing.

## Included
- Mobile-money/bank method request, encrypted values, Admin/Super Admin approvals and Nairobi cutoff windows.
- Super Admin hiring of shortlisted applications through the existing createEmployee flow.
- In-app notifications for messages, task changes, review decisions, and forced reassignment.
- Task Summary with open, in-progress, and completed/canceled tabs and direct reinstatement forms.
- Force reassignment of unsubmitted Tasker claims and claimed Reviewer queues with audit records.
- Read-only 50/30/20 fine allocation audit view.

## Not fully implemented in this package
- Payroll reversal for reinstated *already paid* orders, payout carry-forward, ledger debit/credit reconciliation and 50/30/20 deduction postings. The fine view is an audit, not a ledger posting. Do not process real payroll through these changes until independently reconciled.
- QA claimed task reassignment: current Prisma schema has claimedReviewerId but no claimedQAId; schema and QA queue must be redesigned to represent ownership safely.
- The Tasker compensation condition for reassignment of work after previous submission/review requires per-round assignment history; this patch limits Tasker force reassignment to unsubmitted tasks.
- All notification types, such as payroll settlement and hiring changes, are not yet wired to the event system. Scheduled reminders require a configured scheduler.
- Deletion of the legacy reinstatement route is intentionally omitted because older links may still point to it. Task Summary now offers reinstatement inline.

## Database execution order
1. `prisma/payment-approvals-setup.sql`
2. `prisma/reassignment-events-setup.sql`
3. `prisma/fine-allocation-report.sql`
4. `prisma/operational-notifications-setup.sql`

Use SQL Editor in the correct Evaryn Supabase project and review SQL before running. These are additive apart from redefinition of specific database CHECK constraints and named triggers. Backup database first. Never run `prisma migrate reset`.

## Integration checks
- `npx prisma validate` / `npx prisma generate` / `npx tsc --noEmit` / `npm run build`.
- Verify existing encrypted method entries are preserved and not exposed.
- Check approval up to 1st/16th inclusive, blocked on 2nd–4th/17th–19th in Africa/Nairobi.
- Test task visibility and reviewer self-review guard after reassignment.
- Inspect notifications; task updates may produce multiple alerts during a single workflow.
- Verify category/role checks and that suspended accounts cannot approve anything.
