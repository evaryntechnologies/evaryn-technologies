-- Run once in Supabase SQL Editor before deploying the quoted-reply code.
-- Existing messages and conversations remain unchanged.
ALTER TABLE public."InternalConversationMessage"
  ADD COLUMN IF NOT EXISTS "replyToMessageId" uuid NULL;

-- A reply can only quote a message in the same conversation (also checked in the server action).
CREATE INDEX IF NOT EXISTS "InternalConversationMessage_replyToMessageId_idx"
  ON public."InternalConversationMessage" ("replyToMessageId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'InternalConversationMessage_replyToMessageId_fkey'
      AND conrelid = 'public."InternalConversationMessage"'::regclass
  ) THEN
    ALTER TABLE public."InternalConversationMessage"
      ADD CONSTRAINT "InternalConversationMessage_replyToMessageId_fkey"
      FOREIGN KEY ("replyToMessageId") REFERENCES public."InternalConversationMessage"("id")
      ON DELETE SET NULL;
  END IF;
END $$;
