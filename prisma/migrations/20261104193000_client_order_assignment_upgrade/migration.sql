-- Client-specific, immutable order assignment and staff-published progress updates.
CREATE TABLE "ClientOrderAssignment" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(),
 "taskId" UUID NOT NULL,
 "clientId" UUID NOT NULL,
 "assignedById" UUID NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ClientOrderAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClientOrderAssignment_taskId_key" ON "ClientOrderAssignment"("taskId");
CREATE INDEX "ClientOrderAssignment_clientId_createdAt_idx" ON "ClientOrderAssignment"("clientId","createdAt");
ALTER TABLE "ClientOrderAssignment" ADD CONSTRAINT "ClientOrderAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientOrderAssignment" ADD CONSTRAINT "ClientOrderAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "ClientOrderUpdate" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(),
 "assignmentId" UUID NOT NULL,
 "stage" TEXT NOT NULL,
 "message" TEXT NOT NULL,
 "postedById" UUID NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ClientOrderUpdate_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "ClientOrderUpdate_stage_check" CHECK ("stage" IN ('QUEUED','TASKING','REVIEW','QA','APPROVED','DELIVERED'))
);
CREATE INDEX "ClientOrderUpdate_assignmentId_createdAt_idx" ON "ClientOrderUpdate"("assignmentId","createdAt");
ALTER TABLE "ClientOrderUpdate" ADD CONSTRAINT "ClientOrderUpdate_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ClientOrderAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve and link previously delivered orders to their existing recipients.
-- Never reassign a historical delivery to another client.
INSERT INTO "ClientOrderAssignment" ("id", "taskId", "clientId", "assignedById", "createdAt")
SELECT gen_random_uuid(), d."taskId", d."clientId", d."publishedById", d."publishedAt"
FROM "ClientDelivery" d
WHERE NOT EXISTS (SELECT 1 FROM "ClientOrderAssignment" a WHERE a."taskId" = d."taskId");

INSERT INTO "ClientOrderUpdate" ("id", "assignmentId", "stage", "message", "postedById", "createdAt")
SELECT gen_random_uuid(), a."id", 'DELIVERED',
       'Your completed order was delivered and remains available under Delivered Orders.',
       d."publishedById", d."publishedAt"
FROM "ClientDelivery" d
JOIN "ClientOrderAssignment" a ON a."taskId" = d."taskId"
WHERE NOT EXISTS (SELECT 1 FROM "ClientOrderUpdate" u WHERE u."assignmentId" = a."id" AND u."stage" = 'DELIVERED');
