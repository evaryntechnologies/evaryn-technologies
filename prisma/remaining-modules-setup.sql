-- Review in the correct Evaryn Supabase project before applying.
CREATE TABLE IF NOT EXISTS public."EmployeePaymentMethod" (
 "employeeId" uuid PRIMARY KEY REFERENCES public."EmployeeProfile"(id) ON DELETE CASCADE,
 "method" text NOT NULL CHECK("method" IN ('MPESA','BANK','PAYPAL','PAYONEER','OTHER')),
 "accountName" text NOT NULL,
 "details" text NOT NULL,
 "updatedAt" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public."EmployeePaymentMethod" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."EmployeePaymentMethod" FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS public."AdminTimeSession" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id),
 "startedAt" timestamptz NOT NULL DEFAULT now(),
 "endedAt" timestamptz,
 "rateHourly" numeric(12,2) NOT NULL CHECK("rateHourly">=0),
 CHECK("endedAt" IS NULL OR "endedAt">="startedAt")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminTimeSession_one_open" ON public."AdminTimeSession"("employeeId") WHERE "endedAt" IS NULL;
ALTER TABLE public."AdminTimeSession" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."AdminTimeSession" FROM anon, authenticated;
