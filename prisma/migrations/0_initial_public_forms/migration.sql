-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'IN_DISCUSSION', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'SHORTLISTED', 'HIRED', 'REJECTED');

-- CreateTable
CREATE TABLE "ClientInquiry" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomServiceRequest" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneOrCompany" TEXT,
    "serviceArea" TEXT NOT NULL,
    "requestTitle" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "expectedVolume" TEXT,
    "neededBy" TIMESTAMP(3),
    "exampleLink" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "portfolioLink" TEXT,
    "note" TEXT NOT NULL,
    "cvStorageKey" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientInquiry_status_createdAt_idx" ON "ClientInquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CustomServiceRequest_status_createdAt_idx" ON "CustomServiceRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "JobApplication_status_createdAt_idx" ON "JobApplication"("status", "createdAt");

-- Protect private customer and applicant records.
ALTER TABLE "ClientInquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomServiceRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobApplication" ENABLE ROW LEVEL SECURITY;

-- Revoke direct Data API role privileges.
REVOKE ALL ON TABLE
  "ClientInquiry",
  "CustomServiceRequest",
  "JobApplication"
FROM anon, authenticated;

-- No public access policies are created.
-- Future server endpoints must enforce authorization.
