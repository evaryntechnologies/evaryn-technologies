# Evaryn Phase 6 — Production Release & Verification

This phase is a non-destructive release gate. It adds a read-only production audit script; **it does not modify customer data, payroll, design, authentication, or Supabase migrations**.

Run before deployment:
- `python3 scripts/phase5-audit.py --root . --output "$HOME/evaryn-backups/phase5-final.json"`
- `npx prisma validate && npx prisma generate && npx tsc --noEmit && npm run build`
- `python3 scripts/phase6-production-audit.py --url 'https://YOUR-REAL-DOMAIN' --commit "$(git rev-parse HEAD)" --output "$HOME/evaryn-backups/phase6-production.json"`

After deployment check the active **Production** deployment in Vercel is the new GitHub main commit. A Ready build is not sufficient if an Instant Rollback still controls the domain. The script cannot access authenticated pages or test live client/expert registration, inbound mail, contact submission, QA, or payroll. Complete those manual test scenarios, using test accounts, before calling Phase 6 finished.

Interpret WARN as an unverified behavior, not as a passing test. In particular, HTTP 200 on a protected route is inconclusive; verify it does not expose private information to an anonymous user. Do not share secrets, cookies, or API keys in test reports.
