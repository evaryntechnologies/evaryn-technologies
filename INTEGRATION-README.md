# Evaryn operational modules — phase 1 (latest source snapshot 2026-10-28)

Implemented: Admin recruitment application decisions, shared Super Admin recruitment view, Super Admin client inquiry triage, self-service payment method storage, admin clock-in/out and read-only employee payroll register.

## Required database steps
Run `prisma/remaining-modules-setup.sql` in the correct Supabase project **after reviewing it**. These are new tables, not Prisma models; code uses parameterized raw SQL. Existing `PayrollEntry` table must exist for My Earnings.

## Security
Supabase table RLS enabled and SQL grants revoked from anon/authenticated; access is performed by the server's database connection. Database credentials stay server-side. Payment detail values are not shown back to the user, though they are stored in PostgreSQL in plaintext: **encryption at rest / vault integration and stricter admin access are required before using real bank details**.

## Not finished
- Automated reviewer/QA per-round credits and full payroll ledger/reconciliation
- Payment-method admin viewing/verification and restrictions on paid entries
- Admin session posting to payroll, fine allocation per worker
- Hiring from applications (the review workflow intentionally does not create Auth users automatically)
- Hiring availability toggles and deadline alert scheduler
- Source deployed to GitHub/Vercel and end-to-end tests

No live database was changed. Protect original existing source; overlay only contained files.
