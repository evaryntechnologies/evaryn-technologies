-- Extend pre-existing AdminTimeSession. Do not reset data.
ALTER TABLE public."AdminTimeSession"
  ADD COLUMN IF NOT EXISTS "activeSeconds" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastActiveAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "lastHeartbeatAt" timestamptz;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdminTimeSession_activeSeconds_nonnegative') THEN
  ALTER TABLE public."AdminTimeSession" ADD CONSTRAINT "AdminTimeSession_activeSeconds_nonnegative" CHECK ("activeSeconds" >= 0);
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS "AdminTimeSession_active_lookup" ON public."AdminTimeSession"("employeeId", "endedAt");

-- The existing payroll candidate view must use the activeSeconds field, not wall-clock duration.
CREATE OR REPLACE VIEW public."WorkforcePayCandidates" AS
WITH eligible AS (
 SELECT t.* FROM public."WorkTask" t
 WHERE t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM public."PayrollEntry" old WHERE old."taskId"=t.id)
), tasker_pay AS (
 SELECT ('TASKER:'||t.id::text||':'||t."reinstatementCount"::text) AS "eventKey",
 'TASKER'::text AS "sourceType",t.id AS "taskId", s.id AS "submissionId",NULL::uuid AS "reviewId",NULL::uuid AS "sessionId",
 COALESCE(s."employeeId",t."assignedToId") AS "employeeId",t."clientActionAt" AS "eligibleAt",
 COALESCE(t."totalOrderCost",0)::numeric(16,2) AS "grossAmount",
 COALESCE((SELECT SUM(p.amount) FROM public."TaskPenalty" p WHERE p."taskId"=t.id AND p.status='ACTIVE'),0)::numeric(16,2) AS "fineAmount"
 FROM eligible t
 LEFT JOIN LATERAL (SELECT s.id,s."employeeId" FROM public."TaskSubmission" s WHERE s."taskId"=t.id ORDER BY s."submittedAt" DESC,s.id DESC LIMIT 1) s ON true
 WHERE COALESCE(s."employeeId",t."assignedToId") IS NOT NULL AND COALESCE(t."totalOrderCost",0)>0
), reviewer_pay AS (
 SELECT ('REVIEWER:'||r.id::text) AS "eventKey",'REVIEWER'::text AS "sourceType",t.id AS "taskId",s.id AS "submissionId",r.id AS "reviewId",NULL::uuid AS "sessionId",r."reviewerId" AS "employeeId",t."clientActionAt" AS "eligibleAt",1.50::numeric(16,2) AS "grossAmount",0::numeric(16,2) AS "fineAmount"
 FROM eligible t JOIN public."TaskSubmission" s ON s."taskId"=t.id JOIN public."TaskReview" r ON r."submissionId"=s.id
 WHERE r.stage='REVIEWER' AND r."reviewerId"<>s."employeeId"
), qa_pay AS (
 SELECT ('QA:'||r.id::text) AS "eventKey",'QA'::text AS "sourceType",t.id AS "taskId",s.id AS "submissionId",r.id AS "reviewId",NULL::uuid AS "sessionId",r."reviewerId" AS "employeeId",t."clientActionAt" AS "eligibleAt",1.00::numeric(16,2) AS "grossAmount",0::numeric(16,2) AS "fineAmount"
 FROM eligible t JOIN public."TaskSubmission" s ON s."taskId"=t.id JOIN public."TaskReview" r ON r."submissionId"=s.id
 WHERE r.stage='QA' AND r."reviewerId"<>s."employeeId"
), time_pay AS (
 SELECT ('ADMIN_TIME:'||ses.id::text) AS "eventKey",'ADMIN_TIME'::text AS "sourceType",NULL::uuid AS "taskId",NULL::uuid AS "submissionId",NULL::uuid AS "reviewId",ses.id AS "sessionId",ses."employeeId",ses."endedAt" AS "eligibleAt",
 ROUND((ses."activeSeconds"/3600.0 * ses."rateHourly")::numeric,2)::numeric(16,2) AS "grossAmount",0::numeric(16,2) AS "fineAmount"
 FROM public."AdminTimeSession" ses
 WHERE ses."endedAt" IS NOT NULL AND ses."endedAt">=ses."startedAt"
)
SELECT c.*,public."evarynNextPayday"(c."eligibleAt") AS "payoutDate"
FROM (SELECT * FROM tasker_pay UNION ALL SELECT * FROM reviewer_pay UNION ALL SELECT * FROM qa_pay UNION ALL SELECT * FROM time_pay) c
WHERE NOT EXISTS (SELECT 1 FROM public."WorkforcePayLedger" l WHERE l."eventKey"=c."eventKey");
REVOKE ALL ON public."WorkforcePayCandidates" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public."evarynNextPayday"(timestamptz) FROM PUBLIC, anon, authenticated;
