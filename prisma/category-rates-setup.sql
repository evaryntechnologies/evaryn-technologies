-- Run after category-management-setup.sql; additive, no historic task/pay changes.
ALTER TABLE public."TaskCategory" ADD COLUMN IF NOT EXISTS "rate" NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE public."TaskCategory" ADD COLUMN IF NOT EXISTS "billingUnit" TEXT NOT NULL DEFAULT 'TASK';
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "unitsOrdered" NUMERIC(14,2);
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "unitRate" NUMERIC(14,2);
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "totalOrderCost" NUMERIC(16,2);
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "billingUnit" TEXT;
CREATE TABLE IF NOT EXISTS public."EmployeeCategory" (
  "employeeId" UUID NOT NULL REFERENCES public."EmployeeProfile"("id") ON DELETE CASCADE,
  "categoryId" UUID NOT NULL REFERENCES public."TaskCategory"("id") ON DELETE RESTRICT,
  PRIMARY KEY ("employeeId", "categoryId")
);
CREATE INDEX IF NOT EXISTS "EmployeeCategory_categoryId_idx" ON public."EmployeeCategory" ("categoryId");
ALTER TABLE public."EmployeeCategory" ENABLE ROW LEVEL SECURITY;
-- Prices for seeded/older categories default to 0 until Super Admin sets each rate.
-- Historical WorkTask costs remain unchanged (NULL for legacy tasks).
