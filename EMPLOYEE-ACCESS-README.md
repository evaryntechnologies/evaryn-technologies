# Employee access update

- Super Admin can change employee roles (TASKER, REVIEWER, QA, ADMIN), temporarily suspend, terminate, reinstate, and revoke/delete accounts.
- Admin can change only work categories for Taskers, Reviewers and QA. No role/status/delete controls are available to Admin.
- Deleting revokes Supabase Auth access then anonymizes the EmployeeProfile while retaining task history and references. This is not hard deletion of historical records.
- Temporary suspensions expire on the employee's next authenticated request after their configured time.
- Super Admin and current user accounts are protected from these management actions.
- Existing tasks are not automatically reassigned on suspension, role change or account deletion: administrators must review their queues.
- Requires running `prisma/employee-access-setup.sql` on existing Supabase project before deployment.
- IMPORTANT: If auth deletion succeeds but database archiving fails, account revocation is effective but requires manual profile reconciliation.
