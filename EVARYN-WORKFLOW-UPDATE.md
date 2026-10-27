# Evaryn Operations Update

Install patch files over a **clean, backed-up checkout** of the matching project. First run `prisma/operations-workflow-setup.sql` in the existing Supabase project's SQL Editor. This is not a Prisma migration and must be reviewed. Then run `npx prisma generate`, `npx tsc --noEmit`, `npm run build`; push only after build passes.

New routes: `/portal/tasks/[taskId]/discussion`, `/portal/admin/reassignments`, `/portal/admin/fines`, `/portal/admin/employees`, `/portal/qa/client-actions`. QA approval now sets `DELIVERED_AWAITING_CLIENT`. Client paid/canceled is recorded separately, with 1–5 rating. Open tasks remain in Task Hub, and Reviewer/QA views include pending work.

**Limitations:** Employee Management for Admin is a functional read-only directory; Super Admin retains account provisioning. Penalties are recorded/waived but not yet integrated into payroll payouts. Reviewer/QA claim workflows and notification infrastructure are unchanged. A Super Admin dashboard freeze needs browser/runtime reproduction; responsive navigation state cannot be conclusively fixed from source alone. The client-action update is an internal staff recording workflow, not a client-facing payment integration.
