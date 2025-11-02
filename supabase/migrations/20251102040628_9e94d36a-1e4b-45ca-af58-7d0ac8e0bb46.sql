-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a function to call the edge function
CREATE OR REPLACE FUNCTION public.trigger_legal_news_fetch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function will be called by pg_cron
  -- The actual work is done by the edge function
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/fetch-legal-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the job to run every 12 hours
-- This runs at 6 AM and 6 PM every day
SELECT cron.schedule(
  'fetch-legal-news-job',
  '0 6,18 * * *',
  $$SELECT public.trigger_legal_news_fetch();$$
);

-- Insert initial seed data for legal news
INSERT INTO public.legal_news (title, url, source, published_at)
VALUES 
  ('Supreme Court Dismisses PIL Challenging Electoral Bonds Scheme', 'https://www.barandbench.com/news/supreme-court-electoral-bonds-pil-dismissed', 'Bar & Bench', NOW() - INTERVAL '2 hours'),
  ('High Court Issues Guidelines on Virtual Hearings', 'https://www.livelaw.in/high-court/delhi-high-court-virtual-hearing-guidelines', 'LiveLaw', NOW() - INTERVAL '5 hours'),
  ('New Amendment to Corporate Insolvency Resolution Process', 'https://www.barandbench.com/columns/corporate-insolvency-amendment-analysis', 'Bar & Bench', NOW() - INTERVAL '1 day'),
  ('Supreme Court Clarifies Scope of Right to Privacy', 'https://www.livelaw.in/supreme-court/right-to-privacy-supreme-court-judgment', 'LiveLaw', NOW() - INTERVAL '1 day'),
  ('District Courts Adopt New Case Management System', 'https://www.scconline.com/blog/district-courts-case-management', 'SCC Online', NOW() - INTERVAL '2 days')
ON CONFLICT (url) DO NOTHING;