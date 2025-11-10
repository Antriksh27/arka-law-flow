-- Phase 3: Archive Old Legalkart Case Searches (Revised)
-- This migration archives searches older than 90 days to reduce table size

-- Create archive table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.legalkart_case_searches_archive (
  LIKE public.legalkart_case_searches INCLUDING ALL
);

-- Move old searches to archive (older than 90 days)
INSERT INTO public.legalkart_case_searches_archive
SELECT * FROM public.legalkart_case_searches 
WHERE created_at < NOW() - INTERVAL '90 days'
ON CONFLICT DO NOTHING;

-- Delete archived searches from main table
DELETE FROM public.legalkart_case_searches 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Add indexes to archive table
CREATE INDEX IF NOT EXISTS idx_archive_cnr ON public.legalkart_case_searches_archive(cnr_number);
CREATE INDEX IF NOT EXISTS idx_archive_created_at ON public.legalkart_case_searches_archive(created_at DESC);

-- Note: Run VACUUM manually in SQL editor after migration:
-- VACUUM FULL public.legalkart_case_searches;