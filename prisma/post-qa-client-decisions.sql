-- Evaryn: client decisions on administrator-released deliveries.
-- Additive, no changes to existing task IDs, ledger, or payroll.
BEGIN;
CREATE TABLE IF NOT EXISTS public."ClientDeliveryVersion" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "deliveryId" uuid NOT NULL REFERENCES public."ClientDelivery"("id") ON DELETE RESTRICT,
 "storageKey" text NOT NULL UNIQUE,
 "fileName" text NOT NULL,
 "publishedById" uuid NOT NULL REFERENCES public."EmployeeProfile"("id") ON DELETE RESTRICT,
 "createdAt" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public."ClientDeliveryVersion" ENABLE ROW LEVEL SECURITY;
INSERT INTO public."ClientDeliveryVersion"("deliveryId","storageKey","fileName","publishedById")
 SELECT "id","storageKey","fileName","publishedById" FROM public."ClientDelivery"
 ON CONFLICT ("storageKey") DO NOTHING;
CREATE TABLE IF NOT EXISTS public."ClientDeliveryDecision" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "deliveryId" uuid NOT NULL REFERENCES public."ClientDelivery"("id") ON DELETE RESTRICT,
 "taskId" uuid NOT NULL REFERENCES public."WorkTask"("id") ON DELETE RESTRICT,
 "clientId" uuid NOT NULL REFERENCES public."ClientProfile"("id") ON DELETE RESTRICT,
 "decision" varchar(20) NOT NULL CHECK("decision" IN ('REVISION','CANCELED','PAID_PARTIAL')),
 "reason" text NOT NULL CHECK (length("reason") BETWEEN 10 AND 5000),
 "paidPercent" numeric(5,2),
 "status" varchar(20) NOT NULL CHECK ("status" IN ('APPLIED','PENDING','RESOLVED')),
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT "ClientDeliveryDecision_percent_valid" CHECK (("decision"='PAID_PARTIAL' AND "paidPercent">0 AND "paidPercent"<100) OR ("decision"<>'PAID_PARTIAL' AND "paidPercent" IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClientDeliveryDecision_one_pending_per_task"
 ON public."ClientDeliveryDecision"("taskId") WHERE "status"='PENDING';
CREATE INDEX IF NOT EXISTS "ClientDeliveryDecision_client_created" ON public."ClientDeliveryDecision"("clientId","createdAt");
ALTER TABLE public."ClientDeliveryDecision" ENABLE ROW LEVEL SECURITY;
-- Only trusted server-side Prisma actions access this table; do not grant browser Data API access.
COMMIT;
