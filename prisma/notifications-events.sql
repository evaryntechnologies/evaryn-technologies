-- EVARYN: additive event notifications, for existing production tables.
-- Review this SQL in staging; service-role functions must not be callable by clients.
CREATE OR REPLACE FUNCTION public.evaryn_notify_hiring_update() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status THEN
   INSERT INTO public."PortalNotification" ("id","recipientId","title","body","href","createdAt")
   SELECT gen_random_uuid(), p.id, 'Recruitment update',
     'Application for '||NEW.role||' moved to '||NEW.status::text||'.',
     '/portal/admin/recruitment', now()
   FROM public."EmployeeProfile" p
   WHERE p.status='ACTIVE' AND p.role IN ('ADMIN','SUPER_ADMIN');
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS evaryn_hiring_status_event ON public."JobApplication";
CREATE TRIGGER evaryn_hiring_status_event AFTER UPDATE OF status ON public."JobApplication"
FOR EACH ROW EXECUTE FUNCTION public.evaryn_notify_hiring_update();

CREATE OR REPLACE FUNCTION public.evaryn_notify_dispute_update() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status THEN
   INSERT INTO public."PortalNotification" ("id","recipientId","title","body","href","createdAt")
   SELECT gen_random_uuid(),p.id,'Dispute update',
     'Dispute status changed to '||NEW.status||'.',
     '/portal/tasks/'||NEW."taskId"::text||'/discussion',now()
   FROM public."EmployeeProfile" p
   WHERE p.status='ACTIVE' AND (p.id=NEW."raisedById" OR p.role IN ('QA','ADMIN','SUPER_ADMIN'));
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS evaryn_dispute_status_event ON public."TaskDispute";
CREATE TRIGGER evaryn_dispute_status_event AFTER UPDATE OF status ON public."TaskDispute"
FOR EACH ROW EXECUTE FUNCTION public.evaryn_notify_dispute_update();

CREATE OR REPLACE FUNCTION public.evaryn_notify_staff_account() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status OR NEW.role IS DISTINCT FROM OLD.role THEN
  INSERT INTO public."PortalNotification"("id","recipientId","title","body","href","createdAt")
  VALUES (gen_random_uuid(),NEW.id,'Account update',
   'Your account status or assigned role has changed. Please review your profile.',
   '/portal/profile',now());
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS evaryn_staff_account_event ON public."EmployeeProfile";
CREATE TRIGGER evaryn_staff_account_event AFTER UPDATE OF status, role ON public."EmployeeProfile"
FOR EACH ROW EXECUTE FUNCTION public.evaryn_notify_staff_account();

-- Only create optional payroll trigger if the approved payroll ledger exists.
DO $$ BEGIN
 IF to_regclass('public."WorkforcePayLedger"') IS NOT NULL THEN
 EXECUTE $body$
 CREATE OR REPLACE FUNCTION public.evaryn_notify_payroll_event() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
 BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
   INSERT INTO public."PortalNotification"("id","recipientId","title","body","href","createdAt")
   VALUES(gen_random_uuid(),NEW."employeeId",'Payment update',
   'Your payroll entry is now '||NEW.status||'.', '/portal/earnings',now());
  END IF;
  RETURN NEW;
 END $fn$;
 $body$;
 EXECUTE 'DROP TRIGGER IF EXISTS evaryn_payroll_event ON public."WorkforcePayLedger"';
 EXECUTE 'CREATE TRIGGER evaryn_payroll_event AFTER UPDATE OF status ON public."WorkforcePayLedger" FOR EACH ROW EXECUTE FUNCTION public.evaryn_notify_payroll_event()';
 END IF;
END $$;

-- Payment approvals notifications, if phase 2 table has been installed.
DO $$ BEGIN
 IF to_regclass('public."PaymentChangeRequest"') IS NOT NULL THEN
 EXECUTE $body$
 CREATE OR REPLACE FUNCTION public.evaryn_notify_payment_change() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
 BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
   INSERT INTO public."PortalNotification"("id","recipientId","title","body","href","createdAt")
   VALUES(gen_random_uuid(),NEW."employeeId",'Payment method request',
   'Your payment-method request was '||lower(NEW.status)||'.','/portal/payment-method',now());
  END IF;
  RETURN NEW;
 END $fn$;
 $body$;
 EXECUTE 'DROP TRIGGER IF EXISTS evaryn_payment_change_event ON public."PaymentChangeRequest"';
 EXECUTE 'CREATE TRIGGER evaryn_payment_change_event AFTER UPDATE OF status ON public."PaymentChangeRequest" FOR EACH ROW EXECUTE FUNCTION public.evaryn_notify_payment_change()';
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.evaryn_notify_hiring_update() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.evaryn_notify_dispute_update() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.evaryn_notify_staff_account() FROM PUBLIC,anon,authenticated;
