EVARYN ORDER REINSTATEMENT PATCH

Applies to the operations-workflow release (including the task hub and category assignment models).
New route: /portal/admin/order-reinstatement
Roles: ADMIN and SUPER_ADMIN only, checked both in page and Server Actions.
Run prisma/order-reinstatement-setup.sql in existing Supabase (do not reset).
Run npx prisma generate; npx tsc --noEmit; npm run build; push after success.
Reopening preserves prior submissions, reviews and penalties. It clears the terminal client rating and timestamp; it resets reviewer claim and recalculates deadlines for a direct assignment. The order may be reopened to Task Hub, assigned to a new eligible Tasker, or administratively marked completed/canceled later.
FINANCE WARNING: This patch does not reverse previously paid earnings or automatically credit a reinstated round; verify payments and penalties manually before closing reinstated orders.
