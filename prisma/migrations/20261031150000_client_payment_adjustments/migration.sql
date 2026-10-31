-- Additive audit for post-settlement client decisions. Does not change historical paid rows.
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "clientPaidPercent" numeric(5,2);
ALTER TABLE public."WorkTask" ADD CONSTRAINT "WorkTask_clientPaidPercent_adjustment_range" CHECK ("clientPaidPercent" IS NULL OR "clientPaidPercent" BETWEEN 0 AND 100);
CREATE TABLE IF NOT EXISTS public."ClientPaymentAdjustment" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "taskId" uuid NOT NULL REFERENCES public."WorkTask"(id) ON DELETE RESTRICT,
 "oldPercent" numeric(5,2) NOT NULL CHECK ("oldPercent" BETWEEN 0 AND 100),
 "newPercent" numeric(5,2) NOT NULL CHECK ("newPercent" BETWEEN 0 AND 100),
 "oldRating" integer,
 "newRating" integer CHECK ("newRating" BETWEEN 1 AND 5),
 "reason" text NOT NULL CHECK (length(btrim("reason")) BETWEEN 10 AND 2000),
 "createdById" uuid NOT NULL REFERENCES public."EmployeeProfile"(id),
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 "taskStatusBefore" text NOT NULL
);
CREATE INDEX IF NOT EXISTS "ClientPaymentAdjustment_task_idx" ON public."ClientPaymentAdjustment"("taskId","createdAt" DESC);
CREATE TABLE IF NOT EXISTS public."ClientPaymentAdjustmentLine" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "adjustmentId" uuid NOT NULL REFERENCES public."ClientPaymentAdjustment"(id) ON DELETE RESTRICT,
 "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "sourceType" text NOT NULL CHECK ("sourceType" IN ('TASKER','REVIEWER','QA')),
 "originalAllocation" numeric(16,2) NOT NULL CHECK ("originalAllocation" >= 0),
 "deltaAmount" numeric(16,2) NOT NULL,
 "status" text NOT NULL DEFAULT 'OPEN' CHECK ("status" IN ('OPEN','SETTLED','WAIVED')),
 "resolvedById" uuid REFERENCES public."EmployeeProfile"(id),
 "resolvedAt" timestamptz,
 "reference" text,
 "note" text,
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 UNIQUE ("adjustmentId","employeeId","sourceType"),
 CONSTRAINT "ClientPaymentAdjustmentLine_resolved" CHECK (("status"='OPEN' AND "resolvedAt" IS NULL) OR ("status"<>'OPEN' AND "resolvedAt" IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS "ClientPaymentAdjustmentLine_pending_idx" ON public."ClientPaymentAdjustmentLine"("status","createdAt");
ALTER TABLE public."ClientPaymentAdjustment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClientPaymentAdjustmentLine" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."ClientPaymentAdjustment",public."ClientPaymentAdjustmentLine" FROM anon,authenticated;
