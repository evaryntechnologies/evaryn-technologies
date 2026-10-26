-- Run ONCE in Supabase SQL Editor before deploying category pages. Non-destructive.
CREATE TABLE IF NOT EXISTS public."TaskCategory" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TaskCategory_active_name_idx" ON public."TaskCategory" ("active", "name");
ALTER TABLE public."TaskCategory" ENABLE ROW LEVEL SECURITY;
-- Server-side Prisma accesses through trusted database credentials; clients get no direct access.
INSERT INTO public."TaskCategory" ("name") VALUES
 ('Writing'),('Editing'),('Research'),('Data Annotation'),('Video Editing'),('Other')
ON CONFLICT ("name") DO NOTHING;
INSERT INTO public."TaskCategory" ("name")
SELECT DISTINCT TRIM("category") FROM public."WorkTask"
WHERE "category" IS NOT NULL AND LENGTH(TRIM("category")) BETWEEN 1 AND 80
ON CONFLICT ("name") DO NOTHING;
