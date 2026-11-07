-- Database-first deployment. Back up database before applying.
-- Legacy prices remain USD; new entries can carry native KES amounts.
BEGIN;
ALTER TABLE public."TaskCategory" ADD COLUMN IF NOT EXISTS "rateKES" numeric(14,2);
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "pricingCurrency" varchar(3) NOT NULL DEFAULT 'USD';
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "rateSelection" varchar(12) NOT NULL DEFAULT 'PREDEFINED';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ev_task_category_kes_positive_ck') THEN
  ALTER TABLE public."TaskCategory" ADD CONSTRAINT ev_task_category_kes_positive_ck CHECK ("rateKES" IS NULL OR "rateKES" >= 0); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ev_work_task_currency_ck') THEN
  ALTER TABLE public."WorkTask" ADD CONSTRAINT ev_work_task_currency_ck CHECK ("pricingCurrency" IN ('USD','KES')); END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ev_work_task_rate_selection_ck') THEN
  ALTER TABLE public."WorkTask" ADD CONSTRAINT ev_work_task_rate_selection_ck CHECK ("rateSelection" IN ('PREDEFINED','CUSTOM_RATE','CUSTOM_TOTAL')); END IF;
END $$;
COMMIT;
