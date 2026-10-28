-- Non-destructive. Apply in Supabase SQL editor after backup.
ALTER TABLE public."TaskMessage" ADD COLUMN IF NOT EXISTS "recipientRole" text NOT NULL DEFAULT 'GENERAL';
ALTER TABLE public."TaskMessage" ADD COLUMN IF NOT EXISTS "recipientId" uuid;
CREATE INDEX IF NOT EXISTS "TaskMessage_task_recipient_idx" ON public."TaskMessage" ("taskId", "recipientId", "createdAt");
-- TaskExtraAttachment holds order-wide shared files; no separate message-file table required.
