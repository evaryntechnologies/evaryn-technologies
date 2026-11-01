# Evaryn — Dynamic Careers Categories

This small patch replaces the fixed four-role public Careers list with active categories from `TaskCategory`. Admin and Super Admin can independently open/close hiring for each active category in Recruitment.

## Behavior
- New active category: appears in Recruitment automatically with **Closed hiring** by default.
- Open hiring: category appears at `/careers` and in the `/apply` role picker; submission is validated against current open categories server-side.
- Close hiring: disappears from the open jobs section and role picker immediately on a new request; existing applicant records are retained.
- Rename category: same stable UUID-based hiring slug, so its open/closed setting survives renames.
- Deactivate or delete category: disappears from public Careers and from active Recruitment hiring switches; historical applications remain.
- Previously opened fixed roles (Technical Writer, Content Writer, Data Annotator, Video Editor) are recognized by name as a compatibility fallback until an administrator toggles the new corresponding category record.

## Files modified
- `lib/recruitment-openings.ts`
- `app/(public)/careers/page.tsx`
- `app/(public)/apply/page.tsx`
- `components/forms/ApplicationPreview.tsx`
- `app/portal/admin/recruitment/page.tsx`
- `app/portal/admin/recruitment/HiringControls.tsx`
- `app/portal/admin/recruitment/opening-actions.ts`

No database schema migration is required **provided that** the existing `HiringOpening` and `TaskCategory` tables are deployed. This patch does not alter the applicant approval process, existing application data, or task-category rates.

## Linux / GitHub main
Apply to a clean checkout of the current `main` branch (not to an unrelated extracted ZIP):

```bash
git status
git switch main
git pull --ff-only origin main
unzip -o ~/Downloads/evaryn-dynamic-careers-categories.zip -d .
git diff --check
git diff --stat
npm run build
```

After a successful build and reviewing the changes:

```bash
git add 'app/(public)/careers/page.tsx' 'app/(public)/apply/page.tsx' \
  components/forms/ApplicationPreview.tsx lib/recruitment-openings.ts \
  app/portal/admin/recruitment/page.tsx \
  app/portal/admin/recruitment/HiringControls.tsx \
  app/portal/admin/recruitment/opening-actions.ts
git commit -m "Synchronize public careers with active task categories"
git push origin main
```

Test: add a new active task category, open hiring for it in Recruitment, verify it appears on Careers and the application form, then close hiring and confirm it is no longer selectable.

**Validation limitation:** This package was reviewed statically against the last uploaded ZIP (`evaryn-technologies-main (5).zip`). The local copy has no installed project dependencies or database credentials, so it was not end-to-end tested or production-built.
