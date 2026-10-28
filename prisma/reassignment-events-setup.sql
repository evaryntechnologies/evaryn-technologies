-- Audit history for forced reassignment. This never deletes previous submissions/reviews.
CREATE TABLE IF NOT EXISTS public."TaskForceReassignment" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "taskId" uuid NOT NULL REFERENCES public."WorkTask"(id) ON DELETE RESTRICT,
 "actorId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "stage" text NOT NULL CHECK("stage" IN ('TASKER','REVIEWER')),
 "previousEmployeeId" uuid REFERENCES public."EmployeeProfile"(id),
 "newEmployeeId" uuid REFERENCES public."EmployeeProfile"(id),
 "reason" text NOT NULL CHECK(length("reason")>=10),
 "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TaskForceReassignment_task" ON public."TaskForceReassignment"("taskId","createdAt");
ALTER TABLE public."TaskForceReassignment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."TaskForceReassignment" FROM anon,authenticated;
