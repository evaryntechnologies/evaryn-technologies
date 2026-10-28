-- Evaryn Phase 2. Apply only after reviewing the correct Supabase project.
-- Adds hiring toggles and once-per-deadline reminder delivery; no existing task history is changed.
CREATE TABLE IF NOT EXISTS public."HiringOpening" (
 "slug" text PRIMARY KEY,
 "isOpen" boolean NOT NULL DEFAULT false,
 "updatedAt" timestamptz NOT NULL DEFAULT now(),
 "updatedById" uuid REFERENCES public."EmployeeProfile"(id) ON DELETE SET NULL,
 CONSTRAINT "HiringOpening_allowed_slug" CHECK ("slug" IN ('technical-writer','content-writer','data-annotator','video-editor'))
);
INSERT INTO public."HiringOpening" ("slug","isOpen") VALUES
 ('technical-writer',false),('content-writer',false),('data-annotator',false),('video-editor',false)
ON CONFLICT ("slug") DO NOTHING;
ALTER TABLE public."HiringOpening" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."HiringOpening" FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public."DeadlineReminderDelivery" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "taskId" uuid NOT NULL REFERENCES public."WorkTask"(id) ON DELETE RESTRICT,
 "recipientId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "deadlineAt" timestamptz NOT NULL,
 "thresholdHours" integer NOT NULL CHECK ("thresholdHours" IN (3,5)),
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 UNIQUE ("taskId","recipientId","deadlineAt","thresholdHours")
);
ALTER TABLE public."DeadlineReminderDelivery" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."DeadlineReminderDelivery" FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS "DeadlineReminderDelivery_task_idx" ON public."DeadlineReminderDelivery"("taskId");
