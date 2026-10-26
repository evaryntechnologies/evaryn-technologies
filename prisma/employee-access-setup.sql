-- Existing database only. Review and run once in Supabase SQL Editor.
BEGIN;
ALTER TABLE public."EmployeeProfile" ADD COLUMN IF NOT EXISTS "suspensionUntil" timestamptz;
COMMIT;
