# Evaryn – cross-role Tasker access and separation of duties

Built against user-provided `evaryn-technologies-main (5).zip`. This is a targeted source patch, not an entire project replacement.

- Any active Tasker, Reviewer, QA, Admin or Super Admin assigned as a Tasker can open `/portal/tasker/tasks/<id>` and submit work. The Tasker My Orders page and sidebar work links are available across roles.
- Review queue hides orders the signed-in employee authored, including earlier submissions. Claim and review server actions independently enforce the restriction.
- QA queue hides orders the employee authored or has reviewed at any time, including across revision cycles. QA claim and QA decision server actions check the same restrictions.
- Other authorized employees remain eligible. Assignment/claim ownership and stage checks remain in place.
- No database migration. No payroll changes.

**Compatibility:** If previous patches modified these same source files after the uploaded ZIP, merge carefully rather than blindly overwriting them. The package has NOT been compiled against installed dependencies or tested live.

## Linux deployment (from an actual Git clone on main)

```bash
unzip -o ~/Downloads/evaryn-cross-role-tasking-safeguards.zip -d .
git diff --check
git diff --stat
npx prisma generate
npx tsc --noEmit
npm run build
# Only after successful checks and reviewing the changes:
git add app/portal/PortalShell.tsx app/portal/tasker app/portal/reviewer/queue app/portal/qa/queue
git commit -m "Enable cross-role tasking and block self-review and QA"
git push origin main
```

After deployment verify: QA assigned work submits; Reviewer and Admin assigned work submit; the author cannot claim Review or QA; a reviewer cannot claim QA later; an uninvolved employee of the right role can claim. Test across reinstatement/revision cycles.
