-- Read-only eligibility; not an automatic disbursement implementation.
-- Completed is only set after paid client action; eligible date is that action date.
CREATE OR REPLACE VIEW public."CompletedOrderPayoutEligibility" AS
SELECT t."id" AS "taskId", t."assignedToId" AS "employeeId",
       t."clientActionAt" AS "eligibleSince",
       t."totalOrderCost" AS "grossOrderValue",
       COALESCE((SELECT SUM(p."amount") FROM public."TaskPenalty" p
            WHERE p."taskId"=t."id" AND p."status"='ACTIVE'),0) AS "activeFines",
       GREATEST(COALESCE(t."totalOrderCost",0) - COALESCE((SELECT SUM(p."amount") FROM public."TaskPenalty" p
            WHERE p."taskId"=t."id" AND p."status"='ACTIVE'),0),0) AS "netOrderValue"
FROM public."WorkTask" t
WHERE t."status"='COMPLETED' AND t."clientActionAt" IS NOT NULL;
-- Use this view for future payout-cycle computation. Never infer payout from QA approval.
