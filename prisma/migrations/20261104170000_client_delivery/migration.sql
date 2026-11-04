-- Separates client-facing publication from internal QA approval and payroll outcomes.
CREATE TABLE "ClientDelivery" (
 "id" UUID NOT NULL DEFAULT gen_random_uuid(),
 "taskId" UUID NOT NULL,
 "clientId" UUID NOT NULL,
 "publishedById" UUID NOT NULL,
 "storageKey" TEXT NOT NULL,
 "fileName" TEXT NOT NULL,
 "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "rating" INTEGER,
 "feedback" TEXT,
 "ratedAt" TIMESTAMP(3),
 CONSTRAINT "ClientDelivery_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "ClientDelivery_rating_check" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5)
);
CREATE UNIQUE INDEX "ClientDelivery_taskId_key" ON "ClientDelivery"("taskId");
CREATE INDEX "ClientDelivery_clientId_publishedAt_idx" ON "ClientDelivery"("clientId", "publishedAt");
ALTER TABLE "ClientDelivery" ADD CONSTRAINT "ClientDelivery_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClientDelivery" ADD CONSTRAINT "ClientDelivery_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
