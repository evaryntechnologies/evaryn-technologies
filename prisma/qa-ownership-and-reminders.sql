-- Review before applying. Non-destructive. Run in Supabase SQL Editor before deploy.
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "claimedQaId" uuid;
CREATE INDEX IF NOT EXISTS "WorkTask_claimedQaId_status_idx" ON public."WorkTask"("claimedQaId", "status");
-- Holds a unique reminder per task, stage, owner, deadline timestamp and threshold.
CREATE TABLE IF NOT EXISTS public."TaskStageReminder" (
 "taskId" uuid NOT NULL REFERENCES public."WorkTask"(id),
 "stage" text NOT NULL CHECK ("stage" IN ('TASKER','REVIEWER','QA')),
 "recipientId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id),
 "dueAt" timestamptz NOT NULL,
 "offsetHours" integer NOT NULL CHECK ("offsetHours" IN (24,12,3,1,0,-1,-3,-12,-24)),
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY ("taskId","stage","recipientId","dueAt","offsetHours")
);
ALTER TABLE public."TaskStageReminder" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."TaskStageReminder" FROM anon, authenticated;
