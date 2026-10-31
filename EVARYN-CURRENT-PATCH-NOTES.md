# Evaryn current-source patch — 31 October 2026

Source: evaryn-technologies-main (3).zip. This package modifies only 8 project files.

## Included
- Notifications: own detail route, mark one/all as read, authenticated unread count on header bell.
- Super Admin Pay Team: approved pending balances grouped by employee (first 500 ledger rows), reason-required declines for candidates and pending entries, employee notifications for declined requests.
- Double-payment guard: do not approve/mark as paid a second ledger event for the same order, employee and role if a prior event was already PAID.
- New WorkforcePayDecision table; excludes declined unpaid records without touching settled rows.

## NOT included / limits
- Does not implement installments or employee pay-adjustment accept/dispute. Current system has two separate payroll paths and needs ledger reconciliation before partial payout can be safe.
- Does not make post-payment adjustments auto-deduct from future payroll. Existing /portal/super-admin/payment-adjustments register remains separate.
- Employee overview uses last 500 ledger records, not authoritative lifetime totals. It is a snapshot of approved pending entries.
- The old generic alert destination may still be obsolete, but opening the notification itself now works.
- Not built or run against production; verify npm ci, build, database migration history, and full workflow.
- Only Super Admin can decline payroll in this patch; this preserves the existing payroll authorization model.

## Applying with Linux
1. Backup Supabase production. Verify the exact database and migration history.
2. From repository root, with a clean working tree on main, unzip this patch to repository root.
3. Run: npm ci && npx prisma generate && npm run build
4. Run: npx prisma migrate status, then npx prisma migrate deploy ONLY after confirming target and migration order.
5. Run: git diff --check; git add app/portal/notifications app/api/portal/notifications/unread app/portal/PortalShell.tsx app/portal/super-admin/payroll prisma/migrations/20261031180000_payroll_decision_register
6. Run: git commit -m 'Fix notifications and add audited payroll declines' && git push origin main

Do not use npm audit fix --force during this deployment.
