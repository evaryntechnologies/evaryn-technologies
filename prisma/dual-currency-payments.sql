-- Apply in Supabase SQL editor BEFORE deploying the dual-currency code.
-- USD remains the accounting currency of existing pay/ledger records.
BEGIN;
ALTER TABLE public."EmployeePaymentMethod"
 ADD COLUMN IF NOT EXISTS "currency" varchar(3) NOT NULL DEFAULT 'USD';
ALTER TABLE public."PaymentChangeRequest"
 ADD COLUMN IF NOT EXISTS "currency" varchar(3) NOT NULL DEFAULT 'USD';
ALTER TABLE public."EmployeePaymentMethod"
 ADD CONSTRAINT "employee_payment_currency_valid" CHECK ("currency" IN ('USD','KES'));
ALTER TABLE public."PaymentChangeRequest"
 ADD CONSTRAINT "payment_request_currency_valid" CHECK ("currency" IN ('USD','KES'));
ALTER TABLE public."WorkforcePayoutAdjustment"
 ADD COLUMN IF NOT EXISTS "originalCurrency" varchar(3) NOT NULL DEFAULT 'USD',
 ADD COLUMN IF NOT EXISTS "originalAmount" numeric(16,2),
 ADD COLUMN IF NOT EXISTS "exchangeRate" numeric(15,6);
ALTER TABLE public."WorkforcePayoutAdjustment"
 ADD CONSTRAINT "workforce_adjustment_currency_valid" CHECK ("originalCurrency" IN ('USD','KES'));
CREATE TABLE IF NOT EXISTS public."PayTeamTransferRecord" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"("id") ON DELETE RESTRICT,
 "usdTotal" numeric(14,2) NOT NULL CHECK ("usdTotal" > 0),
 "paymentCurrency" varchar(3) NOT NULL CHECK ("paymentCurrency" IN ('USD','KES')),
 "exchangeRate" numeric(15,6) NOT NULL CHECK ("exchangeRate" > 0),
 "transferAmount" numeric(16,2) NOT NULL CHECK ("transferAmount" > 0),
 "paymentReference" varchar(120) NOT NULL,
 "paidById" uuid NOT NULL REFERENCES public."EmployeeProfile"("id") ON DELETE RESTRICT,
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT "payteam_currency_rate_valid" CHECK ("paymentCurrency" <> 'USD' OR "exchangeRate" = 1),
 UNIQUE("employeeId","paymentReference")
);
CREATE INDEX IF NOT EXISTS "payteam_currency_employee_time" ON public."PayTeamTransferRecord"("employeeId","createdAt" DESC);
ALTER TABLE public."PayTeamTransferRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClientDeliveryDecision"
 ADD COLUMN IF NOT EXISTS "currency" varchar(3),
 ADD COLUMN IF NOT EXISTS "paidAmount" numeric(16,2);
ALTER TABLE public."ClientDeliveryDecision"
 ADD CONSTRAINT "client_report_currency_valid" CHECK ("currency" IS NULL OR "currency" IN ('USD','KES'));
ALTER TABLE public."ClientDeliveryDecision"
 ADD CONSTRAINT "client_report_amount_valid" CHECK ("paidAmount" IS NULL OR "paidAmount" > 0);
COMMIT;
