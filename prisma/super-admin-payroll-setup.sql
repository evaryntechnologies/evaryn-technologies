-- Evaryn: Super Admin payroll register. Review against your production schema first.
-- This is an internal bookkeeping register; no payment is sent by this system.
BEGIN;
CREATE TABLE IF NOT EXISTS public."PayrollEntry" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "taskId" uuid NOT NULL REFERENCES public."WorkTask"(id) ON DELETE RESTRICT,
  "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
  "clientPaidAt" timestamptz NOT NULL,
  "payoutDate" date NOT NULL,
  "grossAmount" numeric(16,2) NOT NULL CHECK ("grossAmount" >= 0),
  "fineAmount" numeric(16,2) NOT NULL DEFAULT 0 CHECK ("fineAmount" >= 0),
  "payableAmount" numeric(16,2) NOT NULL CHECK ("payableAmount" >= 0),
  "status" text NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','PAID')),
  "approvedById" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
  "approvedAt" timestamptz NOT NULL DEFAULT now(),
  "paidById" uuid REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
  "paidAt" timestamptz,
  "paymentReference" text,
  "paymentNote" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PayrollEntry_task_unique" UNIQUE ("taskId"),
  CONSTRAINT "PayrollEntry_paid_consistency" CHECK (
    ("status" = 'PENDING' AND "paidAt" IS NULL AND "paidById" IS NULL)
    OR ("status" = 'PAID' AND "paidAt" IS NOT NULL AND "paidById" IS NOT NULL AND NULLIF(btrim("paymentReference"),'') IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS "PayrollEntry_payoutDate_status_idx" ON public."PayrollEntry"("payoutDate","status");
CREATE INDEX IF NOT EXISTS "PayrollEntry_employeeId_status_idx" ON public."PayrollEntry"("employeeId","status");
-- Browser clients should not access payroll directly; use authenticated server functions.
ALTER TABLE public."PayrollEntry" ENABLE ROW LEVEL SECURITY;
COMMIT;
