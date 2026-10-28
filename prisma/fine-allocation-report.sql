-- Read-only audit: allocate each ACTIVE order-level fine 50% / 30% / 20%.
-- The latest recorded tasker submission and REVIEWER/QA contribution are used.
-- Missing contributors remain unallocated and must be reviewed (not silently charged to others).
CREATE OR REPLACE VIEW public."TaskFineAllocationAudit" AS
WITH task_people AS (
 SELECT t.id AS "taskId",
   (SELECT s."employeeId" FROM public."TaskSubmission" s WHERE s."taskId"=t.id ORDER BY s."submittedAt" DESC LIMIT 1) AS "taskerId",
   (SELECT r."reviewerId" FROM public."TaskReview" r JOIN public."TaskSubmission" s ON s.id=r."submissionId" WHERE s."taskId"=t.id AND r.stage='REVIEWER' ORDER BY r."createdAt" DESC LIMIT 1) AS "reviewerId",
   (SELECT r."reviewerId" FROM public."TaskReview" r JOIN public."TaskSubmission" s ON s.id=r."submissionId" WHERE s."taskId"=t.id AND r.stage='QA' ORDER BY r."createdAt" DESC LIMIT 1) AS "qaId"
 FROM public."WorkTask" t
)
SELECT p.id AS "penaltyId",p."taskId",p.reason,p.amount AS "totalFine",'TASKER'::text AS "level",tp."taskerId" AS "employeeId",round(p.amount*0.50,2) AS "allocatedFine" FROM public."TaskPenalty" p JOIN task_people tp ON tp."taskId"=p."taskId" WHERE p.status='ACTIVE'
UNION ALL SELECT p.id,p."taskId",p.reason,p.amount,'REVIEWER',tp."reviewerId",round(p.amount*0.30,2) FROM public."TaskPenalty" p JOIN task_people tp ON tp."taskId"=p."taskId" WHERE p.status='ACTIVE'
UNION ALL SELECT p.id,p."taskId",p.reason,p.amount,'QA',tp."qaId",p.amount-round(p.amount*0.50,2)-round(p.amount*0.30,2) FROM public."TaskPenalty" p JOIN task_people tp ON tp."taskId"=p."taskId" WHERE p.status='ACTIVE';
REVOKE ALL ON public."TaskFineAllocationAudit" FROM anon, authenticated;
