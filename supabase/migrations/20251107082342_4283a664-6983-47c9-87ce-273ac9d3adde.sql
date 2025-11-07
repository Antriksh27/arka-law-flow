-- Dedup table for notifications to prevent multi-trigger duplicates
CREATE TABLE IF NOT EXISTS public.notification_dedup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (service role bypasses RLS; no public access policies needed)
ALTER TABLE public.notification_dedup ENABLE ROW LEVEL SECURITY;

-- Helpful index for time-based maintenance
CREATE INDEX IF NOT EXISTS idx_notification_dedup_created_at ON public.notification_dedup (created_at DESC);
