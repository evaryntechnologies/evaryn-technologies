# Evaryn Phase 2 — Expert onboarding and approval

This patch intentionally does not overwrite existing files. It adds public routes `/experts`, `/experts/register`, `/experts/login`, `/experts/application`, `/experts/verify-email`, and protected `/super-admin/expert-applications`. It uses the existing Phase 1 `ExpertApplication` model and EmployeeProfile. No new database migration is required.

## Prerequisites
- Phase 1 migration actually deployed (`npx prisma migrate status`).
- `SUPABASE_SERVICE_ROLE_KEY` configured in Vercel server environment and locally for admin approval (NEVER prefix NEXT_PUBLIC_; NEVER expose to browser). Verify existing admin key conventions before adding it.
- `NEXT_PUBLIC_SITE_URL` set to your actual production origin (https://...), or replace the redirect calculation with your canonical origin. Configure that URL in Supabase Auth URL Configuration > Redirect URLs.
- Supabase confirmation email template must link to the `/auth/confirm` callback with `token_hash` and `type=email`, using your established confirmation template. Public registration should not be enabled until this is tested.
- Add links to `/experts` in the public header when ready, and `/super-admin/expert-applications` in your existing Super Admin sidebar. We deliberately have not overwritten those files because the current GitHub main may differ from the uploaded archive.

## Integration
1. Verify GitHub main is current, and your working tree is clean or preserve existing unrelated files.
2. Unzip to a temporary folder and check each new path is absent before copying.
3. Run `npx prisma validate`, `npx prisma generate`, `npx tsc --noEmit`, and `npm run build`.
4. Test signup, email confirmation, status, rejection, waitlist, and approval on an isolated test account with the production-authorized environment. Test that pending experts cannot enter employee APIs.
5. Review the approval operation carefully. Auth and database operations are not atomic; an interrupted approval requires manual reconciliation. No automatic retry should regrant access.
6. Stage only these added files; push to main only after verification.

## Additional notes
- The existing `/auth/confirm` callback currently sends all verified users to the employee login. A dedicated expert confirmation redirect would be a follow-up improvement; this patch sends verified applicants to `/experts/login` manually via the instructions on the signup page.
- No client-facing project features, CV upload, automatic email notifications, or existing sidebar changes are included.
- Public signup needs CAPTCHA/rate limiting and abuse monitoring prior to broad announcement.
- The `ExpertApplication` table has no application audit-event model; keep audit logging on the roadmap.
