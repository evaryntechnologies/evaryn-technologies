# Evaryn role dashboard and navigation patch

Baseline: uploaded `evaryn-technologies-main (5).zip` plus the previously prepared unified sidebar navigation. This is NOT confirmed identical to currently deployed GitHub main.

Changes:
- Dashboard: Tasker sees Awaiting Tasker; Reviewer sees Awaiting Reviewer and Awaiting Tasker; QA sees Awaiting QA, Awaiting Reviewer and Awaiting Tasker. All links use `/portal/task-hub`, `/portal/reviewer/queue`, `/portal/qa/queue`.
- Queue counts exclude the current employee's authored tasks and any orders with their prior review/QA participation. Task Hub count retains existing category eligibility logic.
- Sidebar: consolidated into expandable functional groups for all roles, retaining existing destinations and header notification bell. The updated stylesheet includes expandable-group rules.

No database migration. No authentication, payroll, or task-status mutation.

IMPORTANT: The count helper does not rewrite the existing queue pages. Some queue pages may still show additional records until their query filters are aligned. Cross-role claim APIs still need independent participation enforcement. Do not mistake counts for security enforcement.

Verify the patch against current main before applying. Run `git diff --check`, `npx tsc --noEmit`, `npm run build`, and test Tasker/Reviewer/QA queues with accounts that have previously participated in tasks. Do not deploy if checks fail.
