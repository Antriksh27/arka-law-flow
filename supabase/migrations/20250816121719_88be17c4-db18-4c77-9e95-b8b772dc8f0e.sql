-- Create Google Calendar settings table
CREATE TABLE public.google_calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  calendar_id TEXT,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_direction TEXT NOT NULL DEFAULT 'one_way' CHECK (sync_direction IN ('one_way', 'two_way')),
  auto_sync BOOLEAN NOT NULL DEFAULT false,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 60 CHECK (sync_interval_minutes IN (15, 30, 60, 120, 240)),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.google_calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own Google Calendar settings"
  ON public.google_calendar_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Google Calendar settings"
  ON public.google_calendar_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Calendar settings"
  ON public.google_calendar_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Calendar settings"
  ON public.google_calendar_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_google_calendar_settings_updated_at
  BEFORE UPDATE ON public.google_calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();