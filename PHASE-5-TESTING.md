# Evaryn Phase 5 — Integration and Regression Audit

This release adds a read-only validation tool; it does not change production business logic, permissions, UI, database schema or payroll.

Run: `python3 scripts/phase5-audit.py --root . --output "$HOME/evaryn-backups/phase5-audit.json"`

Optional public smoke checks: `python3 scripts/phase5-audit.py --root . --production-url https://YOUR-PRODUCTION-DOMAIN --output "$HOME/evaryn-backups/phase5-audit.json"`.

The report categorizes each check as PASS, WARN or FAIL. FAIL stops the automated deployment script. WARN indicates something that needs investigation or a real user-driven test. In particular, the automated tool cannot register a real user, complete email verification, test an authorized payroll workflow, verify Resend attachment forwarding, or inspect your Vercel production alias. Those require manual end-to-end tests using test accounts or service logs.

Known issue from the current GitHub main source inspected 2026-11-04: `Client Requests` is present in `roleMenu()`, but `groupedNavigation()` excludes it from `remaining`, and doesn't consume it through `single()` or `section()`; the menu entry can disappear. This audit warns about it, but does not modify navigation per the decision to defer the sidebar issue.

Prior ESLint errors in unrelated existing files are not silently fixed or ignored; the deployment script prints a lint warning and stores its full log separately, but requires Prisma, TypeScript, route/security contract checks and production build to pass.

The initial Phase 5 deployment adds testing infrastructure. Phase 5 cannot be declared fully verified until manual checklist items and active Vercel production deployment have been confirmed.
