-- Phase 3: Fix Missing Columns (Revised)

-- Add missing columns to case_emails
ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS sender TEXT;
ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS recipient TEXT;

-- Add missing columns to instructions
ALTER TABLE public.instructions ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Add missing table for messages (with correct column name)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Add indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);