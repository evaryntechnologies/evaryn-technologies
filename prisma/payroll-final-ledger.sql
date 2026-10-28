-- EVARYN PAYROLL FINAL LEDGER V1. Review on staging before production.
-- Keeps existing PayrollEntry intact. No transfers are made.
CREATE TABLE IF NOT EXISTS public."WorkforcePayLedger" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "eventKey" text NOT NULL UNIQUE,
 "sourceType" text NOT NULL CHECK ("sourceType" IN ('TASKER','REVIEWER','QA','ADMIN_TIME')),
 "taskId" uuid REFERENCES public."WorkTask"(id) ON DELETE RESTRICT,
 "submissionId" uuid REFERENCES public."TaskSubmission"(id) ON DELETE RESTRICT,
 "reviewId" uuid REFERENCES public."TaskReview"(id) ON DELETE RESTRICT,
 "sessionId" uuid,
 "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "eligibleAt" timestamptz NOT NULL,
 "payoutDate" date NOT NULL,
 "grossAmount" numeric(16,2) NOT NULL CHECK ("grossAmount" >= 0),
 "fineAmount" numeric(16,2) NOT NULL DEFAULT 0 CHECK ("fineAmount" >= 0),
 "payableAmount" numeric(16,2) GENERATED ALWAYS AS (GREATEST("grossAmount"-"fineAmount",0)) STORED,
 "status" text NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','PAID')),
 "approvedById" uuid NOT NULL REFERENCES public."EmployeeProfile"(id),
 "approvedAt" timestamptz NOT NULL DEFAULT now(),
 "paidById" uuid REFERENCES public."EmployeeProfile"(id),
 "paidAt" timestamptz,
 "paymentReference" text,
 "paymentNote" text,
 "createdAt" timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT "WorkforcePayLedger_paid_check" CHECK (
  ("status"='PENDING' AND "paidAt" IS NULL AND "paidById" IS NULL)
  OR ("status"='PAID' AND "paidAt" IS NOT NULL AND "paidById" IS NOT NULL AND length(btrim(coalesce("paymentReference",''))) >= 3)
 )
);
CREATE INDEX IF NOT EXISTS "WorkforcePayLedger_employee" ON public."WorkforcePayLedger"("employeeId","payoutDate");
CREATE INDEX IF NOT EXISTS "WorkforcePayLedger_cycle" ON public."WorkforcePayLedger"("payoutDate","status");
ALTER TABLE public."WorkforcePayLedger" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."WorkforcePayLedger" FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public."evarynNextPayday"(source_time timestamptz) RETURNS date
LANGUAGE sql STABLE AS $$
WITH d AS (SELECT (source_time AT TIME ZONE 'Africa/Nairobi')::date AS local_day),
 parts AS (SELECT local_day, date_trunc('month',local_day)::date AS month_start FROM d)
SELECT CASE
 WHEN local_day < month_start + 4 THEN month_start + 4
 WHEN local_day < month_start + 19 THEN month_start + 19
 ELSE (month_start + INTERVAL '1 month')::date + 4 END FROM parts;
$$;

-- Candidates are derived from completed client-paid work; approvals snapshot the amounts.
-- A prior legacy PayrollEntry blocks the same order to prevent double payment.
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
 ROUND((EXTRACT(epoch FROM (ses."endedAt"-ses."startedAt"))/3600.0 * ses."rateHourly")::numeric,2)::numeric(16,2) AS "grossAmount",0::numeric(16,2) AS "fineAmount"
 FROM public."AdminTimeSession" ses
 WHERE ses."endedAt" IS NOT NULL AND ses."endedAt">=ses."startedAt"
)
SELECT c.*,public."evarynNextPayday"(c."eligibleAt") AS "payoutDate"
FROM (SELECT * FROM tasker_pay UNION ALL SELECT * FROM reviewer_pay UNION ALL SELECT * FROM qa_pay UNION ALL SELECT * FROM time_pay) c
WHERE NOT EXISTS (SELECT 1 FROM public."WorkforcePayLedger" l WHERE l."eventKey"=c."eventKey");
REVOKE ALL ON public."WorkforcePayCandidates" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public."evarynNextPayday"(timestamptz) FROM PUBLIC, anon, authenticated;
