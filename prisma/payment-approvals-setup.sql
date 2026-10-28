-- Evaryn payment-change approval; additive; run on the correct Supabase database.
CREATE TABLE IF NOT EXISTS public."PaymentChangeRequest" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
  "method" text NOT NULL CHECK ("method" IN ('MOBILE_MONEY','BANK')),
  "accountName" text NOT NULL,
  "details" text NOT NULL,
  "status" text NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','APPROVED','REJECTED')),
  "requestedAt" timestamptz NOT NULL DEFAULT now(),
  "reviewedAt" timestamptz,
  "reviewedById" uuid REFERENCES public."EmployeeProfile"(id),
  "reviewNote" text,
  CONSTRAINT "PaymentChangeRequest_note_length" CHECK ("reviewNote" IS NULL OR length("reviewNote")<=2000)
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentChangeRequest_one_pending" ON public."PaymentChangeRequest"("employeeId") WHERE "status"='PENDING';
CREATE INDEX IF NOT EXISTS "PaymentChangeRequest_queue" ON public."PaymentChangeRequest"("status","requestedAt");
ALTER TABLE public."PaymentChangeRequest" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."PaymentChangeRequest" FROM anon, authenticated;
-- Extend existing table's CHECK constraint only where necessary. Preserve legacy values.
DO $$
DECLARE c record;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public."EmployeePaymentMethod"'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%method%' LOOP
    EXECUTE format('ALTER TABLE public."EmployeePaymentMethod" DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;
ALTER TABLE public."EmployeePaymentMethod" ADD CONSTRAINT "EmployeePaymentMethod_method_allowed" CHECK("method" IN ('MOBILE_MONEY','BANK','MPESA','PAYPAL','PAYONEER','OTHER'));
