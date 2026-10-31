-- Additive: no historical paid entries are changed. Apply on a verified production backup.
CREATE TABLE IF NOT EXISTS public."WorkforcePayDecision" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventKey" text UNIQUE,
  "ledgerId" uuid UNIQUE REFERENCES public."WorkforcePayLedger"(id) ON DELETE RESTRICT,
  "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
  "decision" text NOT NULL CHECK ("decision" IN ('DECLINED')),
  "reason" text NOT NULL CHECK (length(btrim("reason")) BETWEEN 10 AND 1000),
  "decidedById" uuid NOT NULL REFERENCES public."EmployeeProfile"(id),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "WorkforcePayDecision_target" CHECK (("eventKey" IS NULL) <> ("ledgerId" IS NULL))
);
CREATE INDEX IF NOT EXISTS "WorkforcePayDecision_employee" ON public."WorkforcePayDecision"("employeeId","createdAt");
ALTER TABLE public."WorkforcePayDecision" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."WorkforcePayDecision" FROM anon,authenticated;
