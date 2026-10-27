-- Run after previous Evaryn category, operations, reinstatement and order-editing SQL scripts.
-- Additive; no historical tasks deleted.
CREATE TABLE IF NOT EXISTS public."TaskDispute" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "taskId" uuid NOT NULL REFERENCES public."WorkTask"("id") ON DELETE RESTRICT,
  "raisedById" uuid NOT NULL REFERENCES public."EmployeeProfile"("id") ON DELETE RESTRICT,
  "resolvedById" uuid REFERENCES public."EmployeeProfile"("id") ON DELETE RESTRICT,
  "reason" text NOT NULL,
  "resolution" text,
  "status" text NOT NULL DEFAULT 'OPEN',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "resolvedAt" timestamptz
);
CREATE INDEX IF NOT EXISTS "TaskDispute_taskId_status_idx" ON public."TaskDispute"("taskId","status");
CREATE INDEX IF NOT EXISTS "TaskDispute_status_createdAt_idx" ON public."TaskDispute"("status","createdAt");
CREATE TABLE IF NOT EXISTS public."PortalNotification" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "recipientId" uuid NOT NULL REFERENCES public."EmployeeProfile"("id") ON DELETE RESTRICT,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "href" text,
  "readAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "PortalNotification_recipientId_createdAt_idx" ON public."PortalNotification"("recipientId","createdAt");
-- Keep direct client-side access closed: server actions use authenticated Prisma operations.
ALTER TABLE public."TaskDispute" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PortalNotification" ENABLE ROW LEVEL SECURITY;
