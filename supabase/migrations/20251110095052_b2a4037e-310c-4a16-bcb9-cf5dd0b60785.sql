-- Phase 3: Add Missing Tables and Columns

-- Add missing column to hearings table
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Add missing column to case_emails table  
ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS content TEXT;

-- Recreate message_threads table
CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  is_private BOOLEAN DEFAULT false,
  related_case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate thread_participants table
CREATE TABLE IF NOT EXISTS public.thread_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate instructions table
CREATE TABLE IF NOT EXISTS public.instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  firm_id UUID,
  created_by UUID,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructions ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_message_threads_case ON public.message_threads(related_case_id);
CREATE INDEX IF NOT EXISTS idx_thread_participants_thread ON public.thread_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_participants_user ON public.thread_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_instructions_firm ON public.instructions(firm_id);
CREATE INDEX IF NOT EXISTS idx_instructions_assigned ON public.instructions(assigned_to);