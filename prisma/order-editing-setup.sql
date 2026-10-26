-- Additive change: does not alter/delete existing orders or attachments.
CREATE TABLE IF NOT EXISTS public."TaskExtraAttachment" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 "taskId" uuid NOT NULL REFERENCES public."WorkTask"("id") ON DELETE RESTRICT,
 "uploadedById" uuid NOT NULL,
 "storageKey" text NOT NULL UNIQUE,
 "fileName" text NOT NULL,
 "contentType" text NOT NULL,
 "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TaskExtraAttachment_taskId_createdAt_idx"
 ON public."TaskExtraAttachment"("taskId", "createdAt");
