-- Run once in your EXISTING Evaryn Supabase SQL editor. Non-destructive and idempotent.
BEGIN;
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "clientRating" integer;
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "clientActionAt" timestamptz;
CREATE TABLE IF NOT EXISTS public."TaskMessage" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "taskId" uuid NOT NULL REFERENCES public."WorkTask"(id) ON DELETE RESTRICT,
 "senderId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 body text NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TaskMessage_taskId_createdAt_idx" ON public."TaskMessage"("taskId","createdAt");
CREATE TABLE IF NOT EXISTS public."TaskReassignmentRequest" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "taskId" uuid NOT NULL REFERENCES public."WorkTask"(id) ON DELETE RESTRICT,
 "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 reason text NOT NULL, status text NOT NULL DEFAULT 'PENDING', "adminNote" text,
 "createdAt" timestamptz NOT NULL DEFAULT now(), "resolvedAt" timestamptz
);
CREATE INDEX IF NOT EXISTS "TaskReassignmentRequest_status_createdAt_idx" ON public."TaskReassignmentRequest"(status,"createdAt");
CREATE INDEX IF NOT EXISTS "TaskReassignmentRequest_taskId_employeeId_idx" ON public."TaskReassignmentRequest"("taskId","employeeId");
CREATE TABLE IF NOT EXISTS public."TaskPenalty" (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "taskId" uuid NOT NULL REFERENCES public."WorkTask"(id) ON DELETE RESTRICT,
 "createdById" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 reason text NOT NULL, amount numeric(14,2) NOT NULL CHECK (amount >= 0), note text NOT NULL,
 status text NOT NULL DEFAULT 'ACTIVE', "createdAt" timestamptz NOT NULL DEFAULT now(),
 "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TaskPenalty_taskId_status_idx" ON public."TaskPenalty"("taskId",status);

COMMIT;
