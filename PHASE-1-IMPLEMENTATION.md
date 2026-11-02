# Evaryn Phase 1 — External account foundations

## Scope implemented
- Added dedicated `ClientProfile` and `ExpertApplication` database models, separate from employee profiles.
- Added an explicit `ClientProjectAccess` allowlist join; client project access is never inferred from client input.
- Added page-only `requireClient()` and `requireExpertApplicant()` guards using verified Supabase sessions.
- Retained `requireEmployee()` and all existing employee routes without modifications.
- Added an additive SQL migration; it DOES NOT modify existing employee/payroll tables.

## Not yet implemented
This is the security/data-model foundation only. No public signup, approval actions, client dashboard, route pages, or client-facing APIs have been enabled. The redirect destinations for the new guards are placeholders until Phase 2/3 routes are implemented. Do not link to them yet.

## Deployment gate
1. Check current production branch matches the uploaded archive. If it has advanced, merge only these focused changes and review conflicts.
2. Back up the database and verify restore ability before migrating.
3. Supply existing environment variables privately (do not paste credentials in chat).
4. Run Prisma validation/generation and inspect migration SQL before applying it.
5. Verify old employee, admin, QA, reviewer, payroll and login flows in a safe environment before production release.
6. Do not apply this migration if equivalent account tables have already been introduced by other work.

## Important
The guards are intended for React server page/layout use. API endpoints must use their own explicit 401/403 checks and object-ownership filtering. Never let client-supplied data set `app_metadata.role`; public applications should not create active `EmployeeProfile` records. Supabase email verification and signup account linking need to be implemented safely in later phases.
