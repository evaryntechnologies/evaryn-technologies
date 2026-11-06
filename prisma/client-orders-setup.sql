-- Client order tracking and delivery. Run ONCE in the Supabase SQL editor BEFORE deploying the matching code.
-- Additive only: creates one new table. No existing table, column or row is changed.
CREATE TABLE IF NOT EXISTS public."ClientOrderLink" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "taskId"         uuid NOT NULL UNIQUE REFERENCES public."WorkTask"("id") ON DELETE CASCADE,
  "clientId"       uuid NOT NULL REFERENCES public."ClientProfile"("id") ON DELETE CASCADE,
  "linkedById"     uuid REFERENCES public."EmployeeProfile"("id") ON DELETE SET NULL,
  "deliveredAt"    timestamptz,
  "deliveredById"  uuid REFERENCES public."EmployeeProfile"("id") ON DELETE SET NULL,
  "deliveryNote"   text,
  "clientFeedback" text,
  "ratedAt"        timestamptz,
  "createdAt"      timestamptz NOT NULL DEFAULT now(),
  "updatedAt"      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ClientOrderLink_clientId_deliveredAt_idx" ON public."ClientOrderLink"("clientId","deliveredAt");
-- Keep direct browser access closed: all reads and writes go through authenticated server code.
ALTER TABLE public."ClientOrderLink" ENABLE ROW LEVEL SECURITY;
