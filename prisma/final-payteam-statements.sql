-- Evaryn final payable statements. Run after a backup and the existing
-- WorkforcePayoutAdjustment / PayTeamSettlement migrations have been applied.
BEGIN;
CREATE TABLE IF NOT EXISTS public."WorkforcePayStatement" (
 "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "payoutDate" date NOT NULL,
 "accrued" numeric(16,2) NOT NULL CHECK ("accrued" >= 0),
 "adjustments" numeric(16,2) NOT NULL DEFAULT 0,
 "finalPayable" numeric(16,2) NOT NULL CHECK ("finalPayable" >= 0),
 "state" text NOT NULL DEFAULT 'REVIEW' CHECK ("state" IN ('REVIEW','DISPUTED','CLEARED','PAID')),
 "publishedAt" timestamptz NOT NULL DEFAULT now(),
 "fundsVerifiedAt" timestamptz,
 "fundsVerifiedById" uuid REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "issueText" text,
 "issueAt" timestamptz,
 "resolution" text,
 "resolvedAt" timestamptz,
 "updatedAt" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY ("employeeId","payoutDate"),
 CONSTRAINT "WorkforcePayStatement_balanced" CHECK ("finalPayable"="accrued"+"adjustments"),
 CONSTRAINT "WorkforcePayStatement_issue" CHECK ("state" <> 'DISPUTED' OR ("issueAt" IS NOT NULL AND "issueText" IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS public."WorkforcePayStatementEvent" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "employeeId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "payoutDate" date NOT NULL,
 "eventKind" text NOT NULL CHECK ("eventKind" IN ('PUBLISHED','ISSUE_RAISED','ISSUE_RESOLVED','FUNDS_VERIFIED','PAID')),
 "actorId" uuid NOT NULL REFERENCES public."EmployeeProfile"(id) ON DELETE RESTRICT,
 "accrued" numeric(16,2), "adjustments" numeric(16,2), "finalPayable" numeric(16,2),
 "details" text,
 "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "WorkforcePayStatementEvent_employee_idx" ON public."WorkforcePayStatementEvent"("employeeId","payoutDate","createdAt");
ALTER TABLE public."WorkforcePayStatement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WorkforcePayStatementEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."WorkforcePayStatement",public."WorkforcePayStatementEvent" FROM anon,authenticated;
-- Read/write through server-side Prisma with verified employee identity.
COMMIT;
