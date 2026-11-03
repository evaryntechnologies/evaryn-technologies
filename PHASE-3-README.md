# Phase 3 — Work With Us Client Portal

Adds separate client signup/login, verified client profile provisioning, a protected dashboard, request submission and history, explicitly shared project viewing, and a Super Admin request queue.

**Before database deployment:** confirm the database backup and review migration history. Use `npx prisma migrate deploy` only after verifying pending migrations. The deployment helper applies the migration only when `CONFIRM_DB_BACKUP=YES` is set.

**Vercel:** `NEXT_PUBLIC_SITE_URL` must equal the HTTPS production origin. Supabase Auth must allow `https://YOUR-DOMAIN/auth/confirm` and use the existing token_hash email-confirmation template. Test end-to-end email verification.

**Boundary:** no employee role is created by client signup. Clients are only allowed to see their own requests or work projects explicitly linked through ClientProjectAccess. Super Admin must separately review and authorize requests. Accepted requests are not automatically converted to operational projects.

**After deploy:** test create-account, verify-email, sign in, submit request, view request as owner, reject cross-client request URL, admin updates, and existing expert and employee login. The public client registration flow should not be treated as fully verified without these live tests.
