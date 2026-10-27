# Reinstated order edit override

This patch modifies ONLY the existing order edit Server Action and edit page. Admin / Super Admin can edit an OPEN, ASSIGNED, CLAIMED or IN_PROGRESS reinstated order even when submissions exist from an earlier round. Editing locks after a submission in the CURRENT reinstatement round. Historical submissions remain unchanged. Closed orders must first be reinstated.

Prerequisites: Order Reinstatement patch already installed; Prisma WorkTask.reinstatedAt exists; Order Editing patch already installed. If either is missing, do not apply blindly. No new SQL changes. No changes to pricing, assignee, role privileges, or past submissions.

IMPORTANT: concurrent task submission and editing still needs stronger DB-level coordination if you require strict serialization; the patch rechecks state in a transaction.
