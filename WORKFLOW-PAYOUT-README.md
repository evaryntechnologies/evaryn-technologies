# Evaryn workflow update

This package adds: category-eligible Task Hub claiming for Tasker/Reviewer/QA, tasker role access for Reviewer and QA, disputes with QA/Admin/Super Admin resolution, notifications for disputes and their resolution, QA dashboard claim counters, cancellation without a mandatory rating, and a *read-only* completed-order payout eligibility view.

## Deployment order
1. Apply patch to a clean/committed project copy and review conflicts with any newer edits.
2. `npx prisma validate; npx prisma generate; npx tsc --noEmit; npm run build`.
3. In Supabase SQL Editor, review and execute `prisma/disputes-notifications-setup.sql` and `prisma/payout-eligibility-view.sql` **after** your existing operations and attachment migrations.
4. Verify access per role and ensure the new server-only actions can insert/read notifications.
5. Stage only reviewed paths; push only after build passes.

## Important limitations
- The Earnings and Payroll pages are still placeholders in the original project. The eligibility SQL view is **not a live payout engine** and does not apply the 5th/20th calendar automatically or compute separate reviewer/QA compensation. Do not pay directly from it without validating actual payable shares.
- This patch creates notifications for dispute events. It does not yet integrate notifications for every task and payout event.
- QA review claiming as a reviewer requires separate updates to the Reviewer queue/actions; QA employees can claim and submit tasker work, but do not yet claim reviews from that queue.
- The shared archive was assembled from previous patches and may differ from the current local checkout; do not overwrite newer code without reviewing diffs.
