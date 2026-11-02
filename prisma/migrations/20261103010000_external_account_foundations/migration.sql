-- Phase 1: additive account foundations. No legacy employee or payroll structures change.
CREATE TYPE "ExpertApprovalStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'WAITLISTED', 'APPROVED', 'REJECTED');
CREATE TYPE "ClientAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TABLE "ExpertApplication" (
  "id" UUID NOT NULL,
  "authUserId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "country" TEXT,
  "expertise" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "experience" TEXT,
  "portfolioUrl" TEXT,
  "cvStorageKey" TEXT,
  "status" "ExpertApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" UUID,
  "reviewedAt" TIMESTAMP(3),
  "decisionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExpertApplication_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExpertApplication_authUserId_key" ON "ExpertApplication"("authUserId");
CREATE INDEX "ExpertApplication_status_createdAt_idx" ON "ExpertApplication"("status", "createdAt");
CREATE INDEX "ExpertApplication_email_idx" ON "ExpertApplication"("email");

CREATE TABLE "ClientProfile" (
  "id" UUID NOT NULL,
  "authUserId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "companyName" TEXT,
  "phone" TEXT,
  "status" "ClientAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClientProfile_authUserId_key" ON "ClientProfile"("authUserId");
CREATE INDEX "ClientProfile_email_idx" ON "ClientProfile"("email");
CREATE INDEX "ClientProfile_status_idx" ON "ClientProfile"("status");

CREATE TABLE "ClientProjectAccess" (
  "id" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "workProjectId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClientProjectAccess_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClientProjectAccess_clientId_workProjectId_key" ON "ClientProjectAccess"("clientId", "workProjectId");
CREATE INDEX "ClientProjectAccess_workProjectId_idx" ON "ClientProjectAccess"("workProjectId");
ALTER TABLE "ClientProjectAccess" ADD CONSTRAINT "ClientProjectAccess_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientProjectAccess" ADD CONSTRAINT "ClientProjectAccess_workProjectId_fkey" FOREIGN KEY ("workProjectId") REFERENCES "WorkProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
