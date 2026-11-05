-- Evaryn On Hold: non-destructive audit table. Run after a database backup.
BEGIN;
CREATE TABLE IF NOT EXISTS public."WorkforceHoldAdjustment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ledgerId" uuid NOT NULL REFERENCES public."WorkforcePayLedger"("id") ON DELETE RESTRICT,
  "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"("id") ON DELETE RESTRICT,
  "taskId" uuid REFERENCES public."WorkTask"("id") ON DELETE RESTRICT,
  "sourceType" text NOT NULL,
  "oldGross" numeric(16,2) NOT NULL,
  "newGross" numeric(16,2) NOT NULL,
  "oldFine" numeric(16,2) NOT NULL,
  "newFine" numeric(16,2) NOT NULL,
  "oldPayable" numeric(16,2) NOT NULL,
  "newPayable" numeric(16,2) NOT NULL,
  "adjustmentKind" text NOT NULL CHECK ("adjustmentKind" IN ('AMOUNT','BONUS_PERCENT','FINE_PERCENT','DISMISS_ADMIN_TIME')),
  "adjustmentValue" numeric(16,2) NOT NULL,
  "reason" text NOT NULL CHECK (length(btrim("reason")) BETWEEN 10 AND 2000),
  "createdById" uuid NOT NULL REFERENCES public."EmployeeProfile"("id") ON DELETE RESTRICT,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "WorkforceHoldAdjustment_ledger_created" ON public."WorkforceHoldAdjustment"("ledgerId","createdAt" DESC);
CREATE INDEX IF NOT EXISTS "WorkforceHoldAdjustment_employee_created" ON public."WorkforceHoldAdjustment"("employeeId","createdAt" DESC);
ALTER TABLE public."WorkforceHoldAdjustment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."WorkforceHoldAdjustment" FROM anon, authenticated;
-- Adjustments are append-only, including for privileged application database connections.
CREATE OR REPLACE FUNCTION public."evarynHoldAuditImmutable"() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Hold adjustment audit entries are immutable'; END $$;
DROP TRIGGER IF EXISTS "WorkforceHoldAdjustment_immutable" ON public."WorkforceHoldAdjustment";
CREATE TRIGGER "WorkforceHoldAdjustment_immutable"
  BEFORE UPDATE OR DELETE ON public."WorkforceHoldAdjustment"
  FOR EACH ROW EXECUTE FUNCTION public."evarynHoldAuditImmutable"();
COMMIT;
