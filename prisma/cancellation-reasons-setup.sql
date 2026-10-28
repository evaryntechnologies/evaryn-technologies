-- Evaryn: retain cancellation explanations alongside existing WorkTask records.
-- Review in the existing Supabase project's SQL Editor.
ALTER TABLE public."WorkTask"
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

-- Inspect cancellations without modifying historic rows.
SELECT "id", "status", "cancellationReason", "updatedAt"
FROM public."WorkTask"
WHERE "status" IN ('CANCELED', 'CANCELLED')
ORDER BY "updatedAt" DESC
LIMIT 100;

-- Require a NEW written reason whenever an order transitions into a canceled state.
-- Existing historical rows are unaffected. Other cancellation routes must be
-- updated to supply cancellationReason, otherwise PostgreSQL rejects cancellation.
CREATE OR REPLACE FUNCTION public.evaryn_require_cancellation_reason()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."status" IN ('CANCELED', 'CANCELLED')
     AND (TG_OP = 'INSERT' OR OLD."status" NOT IN ('CANCELED', 'CANCELLED')) THEN
    IF NEW."cancellationReason" IS NULL
       OR length(btrim(NEW."cancellationReason")) < 10
       OR length(NEW."cancellationReason") > 5000 THEN
      RAISE EXCEPTION 'A detailed cancellation reason (10-5000 characters) is required';
    END IF;
    IF TG_OP = 'UPDATE'
       AND NEW."cancellationReason" IS NOT DISTINCT FROM OLD."cancellationReason" THEN
      RAISE EXCEPTION 'Provide a new cancellation reason for this cancellation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS evaryn_cancellation_reason_required ON public."WorkTask";
CREATE TRIGGER evaryn_cancellation_reason_required
BEFORE INSERT OR UPDATE OF "status" ON public."WorkTask"
FOR EACH ROW EXECUTE FUNCTION public.evaryn_require_cancellation_reason();