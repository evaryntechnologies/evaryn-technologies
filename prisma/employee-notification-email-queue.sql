-- Apply in the Evaryn production Supabase SQL Editor, not the Stalwart project.
-- Additive, creates exactly one email-queue record per in-app notification.
CREATE TABLE IF NOT EXISTS public."EmployeeNotificationEmailQueue" (
  "notificationId" uuid PRIMARY KEY REFERENCES public."PortalNotification"("id") ON DELETE CASCADE,
  "status" text NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','PROCESSING','SENT','FAILED')),
  "attempts" integer NOT NULL DEFAULT 0,
  "nextAttemptAt" timestamptz NOT NULL DEFAULT now(),
  "lockedAt" timestamptz,
  "sentAt" timestamptz,
  "lastError" text,
  "providerMessageId" text
);
CREATE INDEX IF NOT EXISTS "EmployeeNotificationEmailQueue_pending_idx"
  ON public."EmployeeNotificationEmailQueue" ("nextAttemptAt") WHERE "status" IN ('PENDING','PROCESSING');
ALTER TABLE public."EmployeeNotificationEmailQueue" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."EmployeeNotificationEmailQueue" FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.evaryn_queue_employee_notification_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public."EmployeeNotificationEmailQueue" ("notificationId")
  VALUES (NEW."id") ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.evaryn_queue_employee_notification_email() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS evaryn_notification_email_enqueue ON public."PortalNotification";
CREATE TRIGGER evaryn_notification_email_enqueue AFTER INSERT ON public."PortalNotification"
FOR EACH ROW EXECUTE FUNCTION public.evaryn_queue_employee_notification_email();
-- Do not backfill historical alerts: avoids unexpectedly emailing months-old notifications.
