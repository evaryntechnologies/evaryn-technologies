-- Server-side in-app event notifications. Test in staging before production.
-- Assumes PortalNotification, TaskMessage, TaskReview, TaskSubmission, WorkTask and EmployeeProfile already exist.
CREATE OR REPLACE FUNCTION public.evaryn_notify_task_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE task_row record;
BEGIN
  SELECT t.id,t.title,t."assignedToId" INTO task_row FROM public."WorkTask" t WHERE t.id=NEW."taskId";
  INSERT INTO public."PortalNotification"("id","recipientId","title","body","href","createdAt")
  SELECT gen_random_uuid(), e.id,'Task clarification', 'A new message was posted on '||COALESCE(task_row.title,'a task'), '/portal/tasks/'||NEW."taskId"::text||'/discussion',now()
  FROM public."EmployeeProfile" e
  WHERE e.status='ACTIVE' AND e.id<>NEW."senderId" AND (e.id=task_row."assignedToId" OR e.role IN ('QA','ADMIN','SUPER_ADMIN'));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS evaryn_task_message_notify ON public."TaskMessage";
CREATE TRIGGER evaryn_task_message_notify AFTER INSERT ON public."TaskMessage" FOR EACH ROW EXECUTE FUNCTION public.evaryn_notify_task_message();

CREATE OR REPLACE FUNCTION public.evaryn_notify_task_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW."assignedToId" IS DISTINCT FROM OLD."assignedToId" OR NEW."instructions" IS DISTINCT FROM OLD."instructions" THEN
    INSERT INTO public."PortalNotification"("id","recipientId","title","body","href","createdAt")
    SELECT gen_random_uuid(),e.id,'Task update', 'Order '||COALESCE(NEW."publicTaskId",NEW.id::text)||' was updated ('||NEW.status||').', '/portal/tasker/tasks/'||NEW.id::text,now()
    FROM public."EmployeeProfile" e
    WHERE e.status='ACTIVE' AND (e.id=NEW."assignedToId" OR e.id=OLD."assignedToId" OR e.role IN ('QA','ADMIN','SUPER_ADMIN'));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS evaryn_task_status_notify ON public."WorkTask";
CREATE TRIGGER evaryn_task_status_notify AFTER UPDATE ON public."WorkTask" FOR EACH ROW EXECUTE FUNCTION public.evaryn_notify_task_status();

CREATE OR REPLACE FUNCTION public.evaryn_notify_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid; assignee uuid;
BEGIN
  SELECT s."taskId",t."assignedToId" INTO tid,assignee FROM public."TaskSubmission" s JOIN public."WorkTask" t ON t.id=s."taskId" WHERE s.id=NEW."submissionId";
  INSERT INTO public."PortalNotification"("id","recipientId","title","body","href","createdAt")
  SELECT gen_random_uuid(),e.id,'Review decision', 'A '||NEW.stage||' decision ('||NEW.decision||') has been recorded.', '/portal/tasker/tasks/'||tid::text,now()
  FROM public."EmployeeProfile" e WHERE e.status='ACTIVE' AND (e.id=assignee OR e.role IN ('ADMIN','SUPER_ADMIN','QA')) AND e.id<>NEW."reviewerId";
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS evaryn_review_notify ON public."TaskReview";
CREATE TRIGGER evaryn_review_notify AFTER INSERT ON public."TaskReview" FOR EACH ROW EXECUTE FUNCTION public.evaryn_notify_review();

-- Existing reminder endpoint /api/internal/deadline-reminders must still be scheduled separately.
