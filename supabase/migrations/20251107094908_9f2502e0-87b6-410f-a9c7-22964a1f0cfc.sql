-- Ensure pg_net extension exists
CREATE SCHEMA IF NOT EXISTS net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA net;
GRANT USAGE ON SCHEMA net TO anon, authenticated, service_role, postgres;

-- Provide a compatibility shim for legacy http_post() calls so they no longer break inserts
-- Variant with explicit content-type as text (many legacy triggers use this)
CREATE OR REPLACE FUNCTION public.http_post(url text, payload jsonb, content_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := url,
    headers := jsonb_build_object('Content-Type', COALESCE(content_type, 'application/json')),
    body := payload
  );
EXCEPTION WHEN undefined_function OR invalid_schema_name OR insufficient_privilege OR others THEN
  -- Never block writes; log and continue
  RAISE NOTICE 'public.http_post shim failed: %', SQLERRM;
END;
$$;

-- Variant without explicit content-type (defaults to application/json)
CREATE OR REPLACE FUNCTION public.http_post(url text, payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := payload
  );
EXCEPTION WHEN undefined_function OR invalid_schema_name OR insufficient_privilege OR others THEN
  RAISE NOTICE 'public.http_post shim (2-arg) failed: %', SQLERRM;
END;
$$;

-- Also harden contact notify functions (if they exist or to be used later)
CREATE OR REPLACE FUNCTION public.notify_contact_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-knock',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('table','contacts','eventType','INSERT','record', row_to_json(NEW))
    );
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'notify_contact_created skipped: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_contact_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://hpcnipcbymruvsnqrmjx.supabase.co/functions/v1/notify-knock',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('table','contacts','eventType','UPDATE','record', row_to_json(NEW), 'oldRecord', row_to_json(OLD))
    );
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'notify_contact_updated skipped: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;