-- Phase 3: Add authenticated client project requests. Does not modify legacy operational tables.
CREATE TYPE "ClientProjectRequestStatus" AS ENUM ('PENDING_REVIEW', 'IN_DISCUSSION', 'ACCEPTED', 'CLOSED', 'REJECTED');
CREATE TABLE "ClientProjectRequest" (
  "id" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "status" "ClientProjectRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClientProjectRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ClientProjectRequest_clientId_createdAt_idx" ON "ClientProjectRequest"("clientId", "createdAt");
CREATE INDEX "ClientProjectRequest_status_createdAt_idx" ON "ClientProjectRequest"("status", "createdAt");
ALTER TABLE "ClientProjectRequest" ADD CONSTRAINT "ClientProjectRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
