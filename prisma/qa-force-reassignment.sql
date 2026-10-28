-- Run only after claimedQaId exists in public."WorkTask".
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='WorkTask' AND column_name='claimedQaId') THEN
  RAISE EXCEPTION 'Missing WorkTask.claimedQaId; apply QA ownership migration first.';
 END IF;
 IF to_regclass('public."TaskForceReassignment"') IS NULL THEN
  RAISE EXCEPTION 'Missing TaskForceReassignment table; run reassignment-events-setup.sql first.';
 END IF;
END $$;
ALTER TABLE public."TaskForceReassignment" DROP CONSTRAINT IF EXISTS "TaskForceReassignment_stage_check";
ALTER TABLE public."TaskForceReassignment" ADD CONSTRAINT "TaskForceReassignment_stage_check" CHECK ("stage" IN ('TASKER','REVIEWER','QA'));
