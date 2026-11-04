-- EVARYN client messages, automated public order identifiers and private attachments.
-- Apply only after verifying prisma/client-orders-setup.sql is already installed.
-- All work is additive; existing task IDs, prices and financial records are preserved.
BEGIN;
ALTER TABLE public."ClientProjectRequest" ADD COLUMN IF NOT EXISTS "clientOrderCode" text;
CREATE UNIQUE INDEX IF NOT EXISTS "ClientProjectRequest_orderCode_unique" ON public."ClientProjectRequest"("clientOrderCode");
ALTER TABLE public."ClientProjectRequest" ADD COLUMN IF NOT EXISTS "terminationReason" text;
ALTER TABLE public."ClientProjectRequest" ADD COLUMN IF NOT EXISTS "terminatedAt" timestamptz;
CREATE TABLE IF NOT EXISTS public."ClientOrderSequence" ("prefix" varchar(3) PRIMARY KEY,"nextNumber" integer NOT NULL CHECK("nextNumber">=0));
ALTER TABLE public."ClientOrderLink" ADD COLUMN IF NOT EXISTS "requestId" uuid;
CREATE UNIQUE INDEX IF NOT EXISTS "ClientOrderLink_requestId_unique" ON public."ClientOrderLink"("requestId");
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='ClientOrderLink_request_fk') THEN
 ALTER TABLE public."ClientOrderLink" ADD CONSTRAINT "ClientOrderLink_request_fk" FOREIGN KEY ("requestId") REFERENCES public."ClientProjectRequest"("id") ON DELETE RESTRICT;
END IF; END $$;
CREATE TABLE IF NOT EXISTS public."ClientOrderMessage" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"requestId" uuid NOT NULL REFERENCES public."ClientProjectRequest"("id") ON DELETE RESTRICT,
 "senderKind" varchar(10) NOT NULL CHECK("senderKind" IN('CLIENT','STAFF')),
 "senderId" uuid NOT NULL,"body" text NOT NULL CHECK(length("body") BETWEEN 1 AND 5000),
 "kind" varchar(15) NOT NULL DEFAULT 'MESSAGE' CHECK("kind" IN('MESSAGE','TERMINATION')),
 "createdAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS "ClientOrderMessage_request_created_idx" ON public."ClientOrderMessage"("requestId","createdAt");
CREATE TABLE IF NOT EXISTS public."ClientOrderAttachment" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),"requestId" uuid NOT NULL REFERENCES public."ClientProjectRequest"("id") ON DELETE RESTRICT,
 "fileName" text NOT NULL,"storageKey" text UNIQUE NOT NULL,"contentType" text NOT NULL,"fileSize" integer NOT NULL,
 "createdAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS "ClientOrderAttachment_request_idx" ON public."ClientOrderAttachment"("requestId");
-- Backfill historic client requests safely and seed per-prefix counters.
-- Existing codes are never rewritten. The row lock serializes concurrent backfills.
DO $$ DECLARE r record; pre varchar(3); n integer; existing_max integer; BEGIN
 FOR pre IN SELECT unnest(ARRAY['VID','TWR','WBD','NTW','ADA','ATO','OTH']) LOOP
  SELECT coalesce(max(substring("clientOrderCode" from 5)::integer),0) INTO existing_max
  FROM public."ClientProjectRequest" WHERE "clientOrderCode" ~ ('^' || pre || '-[0-9]+$');
  INSERT INTO public."ClientOrderSequence"("prefix","nextNumber") VALUES(pre,existing_max)
  ON CONFLICT ("prefix") DO UPDATE SET "nextNumber"=greatest("ClientOrderSequence"."nextNumber",excluded."nextNumber");
 END LOOP;
 FOR r IN SELECT "id","service" FROM public."ClientProjectRequest" WHERE "clientOrderCode" IS NULL ORDER BY "createdAt","id" LOOP
  pre := CASE r."service" WHEN 'Video Editing' THEN 'VID' WHEN 'Technical Writing' THEN 'TWR'
   WHEN 'Website Development' THEN 'WBD' WHEN 'Non-Technical Writing' THEN 'NTW'
   WHEN 'AI Data Annotation' THEN 'ADA' WHEN 'AI Training Data Operations' THEN 'ATO' ELSE 'OTH' END;
  INSERT INTO public."ClientOrderSequence"("prefix","nextNumber") VALUES(pre,1)
  ON CONFLICT ("prefix") DO UPDATE SET "nextNumber"=public."ClientOrderSequence"."nextNumber"+1
  RETURNING "nextNumber" INTO n;
  UPDATE public."ClientProjectRequest" SET "clientOrderCode"=pre||'-'||lpad(n::text,3,'0') WHERE "id"=r."id";
 END LOOP;
END $$;
ALTER TABLE public."ClientOrderSequence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClientOrderMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClientOrderAttachment" ENABLE ROW LEVEL SECURITY;
-- Server actions use Prisma connection; no browser Data API grants are added.
-- Service role uploads to this private Supabase Storage bucket; do NOT make it public.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 VALUES ('evaryn-private-uploads','evaryn-private-uploads',false,10485760,
 ARRAY['application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/png','image/jpeg'])
 ON CONFLICT(id) DO NOTHING;
COMMIT;
