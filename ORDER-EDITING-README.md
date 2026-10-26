# Evaryn order amendments

Apply `prisma/order-editing-setup.sql` in the current Supabase project before using the new edit page. Do not reset the database.

This patch is based on the Evaryn source last supplied in the conversation plus the operations/reinstatement patch. Existing task reference attachments are retained. Each additional file has a separate signed-download route.

Admins/Super Admins can edit an order that is DRAFT, OPEN, ASSIGNED, CLAIMED or IN_PROGRESS and has never been submitted. After a submission, the interface and action refuse edits. The order category, pricing and assignment are not changed in this interface. Changing hours on an assigned task recalculates its corresponding deadlines from the time the update is made.

Validate with `npx prisma generate`, `npx tsc --noEmit`, `npm run build` prior to GitHub deployment. Confirm the patch matches your local version before overwriting any modified files.
