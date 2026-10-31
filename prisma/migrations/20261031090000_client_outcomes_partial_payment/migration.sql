-- Apply once with prisma migrate deploy. No existing ledger entries are modified.
-- Create missing private bucket for reviewer, tasker, QA and revision supporting files.
INSERT INTO storage.buckets (id,name,public) VALUES ('task-attachments','task-attachments',false) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "clientPaidPercent" numeric(5,2);
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "clientRevisionNote" text;
ALTER TABLE public."WorkTask" ADD CONSTRAINT "WorkTask_clientPaidPercent_range" CHECK ("clientPaidPercent" IS NULL OR ("clientPaidPercent" >= 0 AND "clientPaidPercent" <= 100));
-- Legacy completed orders without an explicit percentage remain 100% eligible.
CREATE OR REPLACE VIEW public."WorkforcePayCandidates" AS
WITH eligible AS (
 SELECT t.* FROM public."WorkTask" t
 WHERE t.status IN ('COMPLETED','CANCELED') AND t."clientActionAt" IS NOT NULL AND COALESCE(t."clientPaidPercent",CASE WHEN t.status='COMPLETED' THEN 100 ELSE 0 END)>0
 AND NOT EXISTS (SELECT 1 FROM public."PayrollEntry" old WHERE old."taskId"=t.id)
), tasker_pay AS (
 SELECT ('TASKER:'||t.id::text||':'||t."reinstatementCount"::text) AS "eventKey",
 'TASKER'::text AS "sourceType",t.id AS "taskId", s.id AS "submissionId",NULL::uuid AS "reviewId",NULL::uuid AS "sessionId",
 COALESCE(s."employeeId",t."assignedToId") AS "employeeId",t."clientActionAt" AS "eligibleAt",
 ROUND((COALESCE(t."totalOrderCost",0) * COALESCE(t."clientPaidPercent",100)/100)::numeric,2)::numeric(16,2) AS "grossAmount",
 COALESCE((SELECT SUM(p.amount) FROM public."TaskPenalty" p WHERE p."taskId"=t.id AND p.status='ACTIVE'),0)::numeric(16,2) AS "fineAmount"
 FROM eligible t
 LEFT JOIN LATERAL (SELECT s.id,s."employeeId" FROM public."TaskSubmission" s WHERE s."taskId"=t.id ORDER BY s."submittedAt" DESC,s.id DESC LIMIT 1) s ON true
 WHERE COALESCE(s."employeeId",t."assignedToId") IS NOT NULL AND COALESCE(t."totalOrderCost",0)>0
), reviewer_pay AS (
 SELECT ('REVIEWER:'||r.id::text) AS "eventKey",'REVIEWER'::text AS "sourceType",t.id AS "taskId",s.id AS "submissionId",r.id AS "reviewId",NULL::uuid AS "sessionId",r."reviewerId" AS "employeeId",t."clientActionAt" AS "eligibleAt",ROUND((1.50 * COALESCE(t."clientPaidPercent",100)/100)::numeric,2)::numeric(16,2) AS "grossAmount",0::numeric(16,2) AS "fineAmount"
 FROM eligible t JOIN public."TaskSubmission" s ON s."taskId"=t.id JOIN public."TaskReview" r ON r."submissionId"=s.id
 WHERE r.stage='REVIEWER' AND r."reviewerId"<>s."employeeId"
), qa_pay AS (
 SELECT ('QA:'||r.id::text) AS "eventKey",'QA'::text AS "sourceType",t.id AS "taskId",s.id AS "submissionId",r.id AS "reviewId",NULL::uuid AS "sessionId",r."reviewerId" AS "employeeId",t."clientActionAt" AS "eligibleAt",ROUND((1.00 * COALESCE(t."clientPaidPercent",100)/100)::numeric,2)::numeric(16,2) AS "grossAmount",0::numeric(16,2) AS "fineAmount"
 FROM eligible t JOIN public."TaskSubmission" s ON s."taskId"=t.id JOIN public."TaskReview" r ON r."submissionId"=s.id
 WHERE r.stage='QA' AND r."reviewerId"<>s."employeeId"
), time_pay AS (
 SELECT ('ADMIN_TIME:'||ses.id::text) AS "eventKey",'ADMIN_TIME'::text AS "sourceType",NULL::uuid AS "taskId",NULL::uuid AS "submissionId",NULL::uuid AS "reviewId",ses.id AS "sessionId",ses."employeeId",ses."endedAt" AS "eligibleAt",
 ROUND((EXTRACT(epoch FROM (ses."endedAt"-ses."startedAt"))/3600.0 * ses."rateHourly")::numeric,2)::numeric(16,2) AS "grossAmount",0::numeric(16,2) AS "fineAmount"
 FROM public."AdminTimeSession" ses
 WHERE ses."endedAt" IS NOT NULL AND ses."endedAt">=ses."startedAt"
)
SELECT c.*,public."evarynNextPayday"(c."eligibleAt") AS "payoutDate"
FROM (SELECT * FROM tasker_pay UNION ALL SELECT * FROM reviewer_pay UNION ALL SELECT * FROM qa_pay UNION ALL SELECT * FROM time_pay) c
WHERE (c."grossAmount"-c."fineAmount") > 0 AND NOT EXISTS (SELECT 1 FROM public."WorkforcePayLedger" l WHERE l."eventKey"=c."eventKey");
