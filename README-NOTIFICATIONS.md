# Evaryn notification patch

Implements an always-existing full notification detail route, per-user read and mark-all-read, and server-driven unread count on a header bell.

## Important
This patch was prepared from the older uploaded Evaryn source ZIP. Compare every modified file against your **current** GitHub `main` before applying. It does **not** include the outstanding payroll draft or a database migration.

## Commands (Linux)
From repository root after saving current work and reviewing differences:
```bash
unzip -o ~/Downloads/evaryn-notifications-fix.zip -d .
git diff --check
npm run build
git add app/portal/notifications app/portal/PortalShell.tsx app/portal/PortalShellWithNotifications.tsx app/portal/layout.tsx
git commit -m 'Repair notification details and unread bell counter'
git push origin main
```

The detail route checks ownership by recipient ID, and related links are limited to internal `/portal/` paths. A stale related page may still 404, but the notification itself will always have a detail view.
