-- Evaryn: named, signed employee-level payout adjustments. Back up production first.
-- Payout adjustments are NOT attached to orders. They are not payment transfers.
BEGIN;
CREATE TABLE IF NOT EXISTS public."WorkforcePayoutAdjustment" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "payoutDate" date NOT NULL,
 "label" text NOT NULL CHECK (length(btrim("label")) BETWEEN 2 AND 100),
 "reason" text NOT NULL CHECK (length(btrim("reason")) BETWEEN 10 AND 2000),
 "amount" numeric(16,2) NOT NULL CHECK ("amount" <> 0),
 "createdById" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 "settlementId" uuid REFERENCES public."PayTeamSettlement"(id) ON DELETE RESTRICT,
 "settledAt" timestamptz,
 CONSTRAINT "WorkforcePayoutAdjustment_settled_consistent" CHECK (("settlementId" IS NULL AND "settledAt" IS NULL) OR ("settlementId" IS NOT NULL AND "settledAt" IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS "WorkforcePayoutAdjustment_employee_period" ON public."WorkforcePayoutAdjustment"("employeeId","payoutDate","settlementId");
ALTER TABLE public."WorkforcePayoutAdjustment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."WorkforcePayoutAdjustment" FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public."evarynPayoutAdjustmentGuard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Payout adjustment audit records cannot be deleted'; END IF;
 IF OLD."settlementId" IS NOT NULL OR NEW."settlementId" IS NULL OR NEW."settledAt" IS NULL
   OR (to_jsonb(NEW) - 'settlementId' - 'settledAt') IS DISTINCT FROM (to_jsonb(OLD) - 'settlementId' - 'settledAt') THEN
   RAISE EXCEPTION 'Only first-time settlement linking is permitted';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS "WorkforcePayoutAdjustment_guard" ON public."WorkforcePayoutAdjustment";
CREATE TRIGGER "WorkforcePayoutAdjustment_guard" BEFORE UPDATE OR DELETE ON public."WorkforcePayoutAdjustment"
 FOR EACH ROW EXECUTE FUNCTION public."evarynPayoutAdjustmentGuard"();
COMMIT;

-- Run in a separate transaction: auditable, fixed 50/30/20 order distributions.
BEGIN;
CREATE TABLE IF NOT EXISTS public."WorkforceOrderDistribution" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "taskId" uuid NOT NULL REFERENCES public."WorkTask"(id) ON DELETE RESTRICT,
 "kind" text NOT NULL CHECK ("kind" IN ('BONUS','FINE')),
 "totalAmount" numeric(16,2) NOT NULL CHECK ("totalAmount">0),
 "adminRetained" numeric(16,2) NOT NULL CHECK ("adminRetained">=0),
 "distribution" jsonb NOT NULL,
 "reason" text NOT NULL CHECK (length(btrim("reason")) BETWEEN 10 AND 2000),
 "createdById" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "WorkforceOrderDistribution_task" ON public."WorkforceOrderDistribution"("taskId","createdAt" DESC);
ALTER TABLE public."WorkforceOrderDistribution" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."WorkforceOrderDistribution" FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public."evarynOrderDistributionImmutable"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Order distribution audit entries are immutable'; END $$;
DROP TRIGGER IF EXISTS "WorkforceOrderDistribution_immutable" ON public."WorkforceOrderDistribution";
CREATE TRIGGER "WorkforceOrderDistribution_immutable" BEFORE UPDATE OR DELETE ON public."WorkforceOrderDistribution"
 FOR EACH ROW EXECUTE FUNCTION public."evarynOrderDistributionImmutable"();
COMMIT;

-- Permit a positive, explicitly named final adjustment even if approved ledger
-- currently totals 0.00; paidTotal must remain positive under the existing constraint.
BEGIN;
ALTER TABLE public."PayTeamSettlement" DROP CONSTRAINT IF EXISTS "PayTeamSettlement_approvedTotal_check";
ALTER TABLE public."PayTeamSettlement" DROP CONSTRAINT IF EXISTS "PayTeamSettlement_approvedTotal_nonnegative";
ALTER TABLE public."PayTeamSettlement" ADD CONSTRAINT "PayTeamSettlement_approvedTotal_nonnegative" CHECK ("approvedTotal">=0);
COMMIT;
