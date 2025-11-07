-- Clean up legacy Novu notification triggers to stop duplicate notifications
-- Drop specific Novu triggers created by earlier migrations
DO $$ BEGIN
  -- Triggers created by 20251016152325 (notify_novu_on_change)
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE t.tgname='notify_novu_cases_trigger' AND c.relname='cases') THEN
    EXECUTE 'DROP TRIGGER notify_novu_cases_trigger ON public.cases';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE t.tgname='notify_novu_clients_trigger' AND c.relname='clients') THEN
    EXECUTE 'DROP TRIGGER notify_novu_clients_trigger ON public.clients';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE t.tgname='notify_novu_appointments_trigger' AND c.relname='appointments') THEN
    EXECUTE 'DROP TRIGGER notify_novu_appointments_trigger ON public.appointments';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE t.tgname='notify_novu_tasks_trigger' AND c.relname='tasks') THEN
    EXECUTE 'DROP TRIGGER notify_novu_tasks_trigger ON public.tasks';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE t.tgname='notify_novu_invoices_trigger' AND c.relname='invoices') THEN
    EXECUTE 'DROP TRIGGER notify_novu_invoices_trigger ON public.invoices';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE t.tgname='notify_novu_documents_trigger' AND c.relname='documents') THEN
    EXECUTE 'DROP TRIGGER notify_novu_documents_trigger ON public.documents';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE t.tgname='notify_novu_hearings_trigger' AND c.relname='hearings') THEN
    EXECUTE 'DROP TRIGGER notify_novu_hearings_trigger ON public.hearings';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE t.tgname='notify_novu_messages_trigger' AND c.relname='messages') THEN
    EXECUTE 'DROP TRIGGER notify_novu_messages_trigger ON public.messages';
  END IF;

  -- Triggers created by 20251017050456 (notify_novu_on_change variant)
  IF EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgname='notify_novu_cases') THEN EXECUTE 'DROP TRIGGER notify_novu_cases ON public.cases'; END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgname='notify_novu_clients') THEN EXECUTE 'DROP TRIGGER notify_novu_clients ON public.clients'; END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgname='notify_novu_appointments') THEN EXECUTE 'DROP TRIGGER notify_novu_appointments ON public.appointments'; END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgname='notify_novu_tasks') THEN EXECUTE 'DROP TRIGGER notify_novu_tasks ON public.tasks'; END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgname='notify_novu_hearings') THEN EXECUTE 'DROP TRIGGER notify_novu_hearings ON public.hearings'; END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgname='notify_novu_documents') THEN EXECUTE 'DROP TRIGGER notify_novu_documents ON public.documents'; END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgname='notify_novu_messages') THEN EXECUTE 'DROP TRIGGER notify_novu_messages ON public.messages'; END IF;

  -- Triggers created by 20251019054903 (generic notify_novu_trigger)
  IF EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgname='notify_novu_trigger') THEN
    -- Drop on all known tables (if exists)
    EXECUTE 'DROP TRIGGER IF EXISTS notify_novu_trigger ON public.appointments';
    EXECUTE 'DROP TRIGGER IF EXISTS notify_novu_trigger ON public.tasks';
    EXECUTE 'DROP TRIGGER IF EXISTS notify_novu_trigger ON public.cases';
    EXECUTE 'DROP TRIGGER IF EXISTS notify_novu_trigger ON public.clients';
    EXECUTE 'DROP TRIGGER IF EXISTS notify_novu_trigger ON public.documents';
    EXECUTE 'DROP TRIGGER IF EXISTS notify_novu_trigger ON public.hearings';
    EXECUTE 'DROP TRIGGER IF EXISTS notify_novu_trigger ON public.messages';
    EXECUTE 'DROP TRIGGER IF EXISTS notify_novu_trigger ON public.message_threads';
  END IF;
END $$;

-- Finally, drop the legacy Novu functions (no longer used)
DROP FUNCTION IF EXISTS notify_novu_on_change() CASCADE;
DROP FUNCTION IF EXISTS notify_novu() CASCADE;