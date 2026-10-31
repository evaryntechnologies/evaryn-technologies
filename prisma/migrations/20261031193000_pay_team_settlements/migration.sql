-- Records a final external settlement against a selected employee and payout date.
-- Does not rewrite historical paid ledger entries or initiate a money transfer.
CREATE TABLE public."PayTeamSettlement" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "payoutDate" date NOT NULL,
 "approvedTotal" numeric(16,2) NOT NULL CHECK ("approvedTotal">0),
 "paidTotal" numeric(16,2) NOT NULL CHECK ("paidTotal">0 AND "paidTotal"<="approvedTotal"),
 "reason" text,
 "paymentReference" text NOT NULL,
 "paidById" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT "PayTeamSettlement_reason_required" CHECK ("paidTotal"="approvedTotal" OR length(btrim(coalesce("reason",'')))>=10)
);
CREATE TABLE public."PayTeamAllocation" (
 "settlementId" uuid NOT NULL REFERENCES public."PayTeamSettlement"(id) ON DELETE RESTRICT,
 "ledgerId" uuid PRIMARY KEY REFERENCES public."WorkforcePayLedger"(id) ON DELETE RESTRICT,
 "paidAmount" numeric(16,2) NOT NULL CHECK ("paidAmount">=0)
);
CREATE INDEX "PayTeamSettlement_employee_date" ON public."PayTeamSettlement" ("employeeId","payoutDate");
ALTER TABLE public."PayTeamSettlement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PayTeamAllocation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."PayTeamSettlement",public."PayTeamAllocation" FROM anon,authenticated;
