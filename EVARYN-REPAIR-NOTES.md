# Evaryn targeted repairs — 31 October 2026

## Scope
- Reviewer approval/rework, QA approval/rework and tasker submission allow an optional supporting file. A file that *is* selected still uses the original private storage validation, 10 MB limit, ownership checks and rollback cleanup. Role access, claim requirements and task status transitions are unchanged.
- Super Admin payroll candidate lists exclude zero and negative **net** earnings; the server-side approval check also requires positive net earnings.
- Payment method: employees without a saved method can create their initial method even in the normal cutoff period, with Admin or Super Admin approval required. Existing methods use the original Nairobi payout cutoff (1st / 16th for payouts on the 5th / 20th). Rejection remains available during cutoff periods.
- Admin time tracker displays $ before accrued amount; Super Admin can review positive payable admin sessions.

## Important limits
These are source-level changes, not an end-to-end test on your production database. No live Supabase/Vercel credentials are present here. Do not describe every portal button as tested; other server actions exist and may need a separate audit. Confirm payment dates 5th and 20th match your active payroll policy before deployment. If attachments are mandatory under a client contract, revert the three optional-file modifications and repair the storage configuration instead.

## Deployment guidance
Apply the included overlay onto an up-to-date git checkout, commit and push to a preview branch first. Vercel should build against correctly configured server-side environment variables. Do not run Prisma db push, migrations, or SQL: this patch changes no schema.

## Manual smoke test after preview build
1. Tasker submits text-only work; it appears in reviewer queue.
2. Reviewer claims, approves without file; it appears in QA queue. Test revision path separately.
3. QA claims, approves without file; it appears in client-actions queue. Test revision path separately.
4. Repeat with a small attachment to verify Supabase private bucket configuration.
5. Confirm Admin sees tracked time and Super Admin sees only net-positive approval candidates; refresh after approval.
6. New employee submits first payment method, admin approves, and employee sees current method. Then test a subsequent change in allowed and locked windows.
7. Confirm payout recording still requires an approved employee payment method.
