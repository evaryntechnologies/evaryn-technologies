# Evaryn Super Admin Sidebar Consolidation

Based on the latest uploaded `evaryn-technologies-main (5).zip`.

## Files changed
- app/portal/PortalShell.tsx
- app/portal/portal-shell.css

Super Admin only: Dashboard, All My Orders, Order Queues, Operations Hub, Disputes, People Management, Finances, Other Operations. Groups are expandable. Notifications remain in the header bell. Existing routes and permission logic are not modified. Other roles retain their original menus.

Important: Team Memos (`/portal/announcements`) requires the previously prepared workflow/communications patch to have been deployed; it was not included in uploaded ZIP (5). The link is included to match requested current navigation. If it is not deployed, do not use the link until that page exists.

## Apply to real Git checkout on Linux

Check `git status` before copying. From your actual Git repo root (the folder containing `.git`):

    unzip -o ~/Downloads/evaryn-super-admin-sidebar.zip -d .
    git diff --check
    git diff -- app/portal/PortalShell.tsx app/portal/portal-shell.css
    npm run build

Only if the build succeeds:

    git add app/portal/PortalShell.tsx app/portal/portal-shell.css
    git commit -m "Consolidate Super Admin navigation into grouped sections"
    git push origin main

No database migration. Does not rewrite pages or authorization. Since the zip source may predate subsequent deployments, compare these two files to your current GitHub main before overwriting. Full build was not run in packaging environment.
