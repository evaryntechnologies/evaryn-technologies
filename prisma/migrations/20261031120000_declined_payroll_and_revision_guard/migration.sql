-- Create an auditable denylist for unapproved events. Protect paid entries.
CREATE TABLE IF NOT EXISTS public."WorkforcePayDecline" (
 "eventKey" text PRIMARY KEY,
 "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id),
 "taskId" uuid REFERENCES public."WorkTask"(id),
 "sourceType" text NOT NULL,
 "reason" text NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
 "declinedById" uuid NOT NULL REFERENCES public."EmployeeProfile"(id),
 "declinedAt" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public."WorkforcePayDecline" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."WorkforcePayDecline" FROM anon,authenticated;
-- Preserve PAID history; allow only not-yet-paid ledger entries to be declined.
ALTER TABLE public."WorkforcePayLedger" DROP CONSTRAINT IF EXISTS "WorkforcePayLedger_status_check";
ALTER TABLE public."WorkforcePayLedger" ADD CONSTRAINT "WorkforcePayLedger_status_check" CHECK ("status" IN ('PENDING','PAID','DECLINED'));
ALTER TABLE public."WorkforcePayLedger" DROP CONSTRAINT IF EXISTS "WorkforcePayLedger_paid_check";
ALTER TABLE public."WorkforcePayLedger" ADD CONSTRAINT "WorkforcePayLedger_paid_check" CHECK (
 ("status" IN ('PENDING','DECLINED') AND "paidAt" IS NULL AND "paidById" IS NULL)
 OR ("status"='PAID' AND "paidAt" IS NOT NULL AND "paidById" IS NOT NULL AND length(btrim(coalesce("paymentReference",''))) >= 3)
);
-- Prevent editing a settled payment or changing a declined ledger entry back to pending.
CREATE OR REPLACE FUNCTION public.evaryn_protect_payroll_settlement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.status = 'PAID' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW."grossAmount" IS DISTINCT FROM OLD."grossAmount" OR NEW."fineAmount" IS DISTINCT FROM OLD."fineAmount" OR NEW."employeeId" IS DISTINCT FROM OLD."employeeId") THEN
  RAISE EXCEPTION 'Settled payout is immutable';
 END IF;
 IF OLD.status = 'DECLINED' AND NEW.status IS DISTINCT FROM OLD.status THEN
  RAISE EXCEPTION 'Declined payout cannot be reopened';
 END IF;
 RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS evaryn_protect_payroll_settlement ON public."WorkforcePayLedger";
CREATE TRIGGER evaryn_protect_payroll_settlement BEFORE UPDATE ON public."WorkforcePayLedger" FOR EACH ROW EXECUTE FUNCTION public.evaryn_protect_payroll_settlement();
