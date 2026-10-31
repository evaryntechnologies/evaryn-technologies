# Evaryn targeted workflow and communications patch

Baseline: user-uploaded evaryn-technologies-main (5).zip. This patch contains only the files listed in the ZIP.

INCLUDED:
- Server-side QA and Reviewer restrictions against handling tasks the same employee authored or previously reviewed. QA queue hides prohibited items.
- Ratings show client rating and paid percentage for orders the employee submitted or participated in reviewing.
- Compact rating cards.
- Responsive general team memo editor accessible to Reviewer, QA, Admin, Super Admin, delivered to all ACTIVE employee notification inboxes. No schema migration.
- Manage All Undelivered Orders dashboard link and task management quick links; attention counter excludes completed/delivered/canceled orders.
- Known legacy notification URL aliases (not a global 404 repair).

NOT YET IMPLEMENTED (do not claim these are complete):
- Automated overdue multi-role notification cron, deduplication and lifecycle resolution.
- Complete Task Hub redesign, merging force-reassign list into undelivered dashboard.
- Admin-hour rejection UI and transactions.
- Super Admin-only applicant-to-waiting-pool approval.
- Adjustment accept/dispute actions and financial reconciliation.
- Full notification URL destination verification and role-specific routing.

SECURITY: team messages go to all active employees, with the same text. Avoid sensitive individual details.

DEPLOYMENT: extract at repo root; inspect git diff; run npm ci, npx prisma generate, npm run build. Only commit changed files after a successful build. No schema migration included. This patch was not live-tested.
