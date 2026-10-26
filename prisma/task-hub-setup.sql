-- Apply AFTER the category-management and category-rates scripts. Non-destructive.
-- Allows draft and published/unclaimed tasks to exist without an assignee.
ALTER TABLE public."WorkTask" ALTER COLUMN "assignedToId" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "WorkTask_hub_status_category_idx"
  ON public."WorkTask" ("status", "category") WHERE "assignedToId" IS NULL;
-- Drafts use status DRAFT; public unclaimed orders use status OPEN.
-- No changes to existing task rows.
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "submissionHours" DOUBLE PRECISION;
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "reviewHours" DOUBLE PRECISION;
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "qaHours" DOUBLE PRECISION;
