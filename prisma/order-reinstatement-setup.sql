-- Run in the EXISTING Evaryn Supabase SQL Editor after backing up the database.
-- Additive: existing task history and records are preserved.
BEGIN;
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "reinstatedAt" timestamptz;
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "reinstatedById" uuid;
ALTER TABLE public."WorkTask" ADD COLUMN IF NOT EXISTS "reinstatementCount" integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "WorkTask_reinstatedAt_idx" ON public."WorkTask" ("reinstatedAt");
COMMIT;
