-- Permit existing legacy hiring slugs and UUID-backed task categories.
-- No hiring openings or applications are deleted or modified.
ALTER TABLE public."HiringOpening"
  DROP CONSTRAINT IF EXISTS "HiringOpening_allowed_slug";

ALTER TABLE public."HiringOpening"
  ADD CONSTRAINT "HiringOpening_allowed_slug" CHECK (
    "slug" IN ('technical-writer', 'content-writer', 'data-annotator', 'video-editor')
    OR "slug" ~* '^category-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );
