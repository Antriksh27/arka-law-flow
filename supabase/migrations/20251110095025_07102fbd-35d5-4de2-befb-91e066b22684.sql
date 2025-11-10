-- Phase 3: Restore Essential Tables
-- These tables are still referenced in code and need to exist

-- Recreate hearings table (legacy, maps to case_hearings)
CREATE TABLE IF NOT EXISTS public.hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  hearing_date DATE NOT NULL,
  hearing_time TIME,
  court_name TEXT,
  hearing_type TEXT,
  status TEXT,
  notes TEXT,
  outcome TEXT,
  bench TEXT,
  coram TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  firm_id UUID,
  created_by UUID
);

-- Recreate case_emails table
CREATE TABLE IF NOT EXISTS public.case_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id UUID,
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate case_files table (legacy, maps to documents)
CREATE TABLE IF NOT EXISTS public.case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate case_notes table (legacy, use notes_v2 instead)
CREATE TABLE IF NOT EXISTS public.case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  note_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Recreate court_hearings table (legacy duplicate of case_hearings)
CREATE TABLE IF NOT EXISTS public.court_hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  hearing_date DATE,
  court_name TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add basic RLS on legacy tables
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_hearings ENABLE ROW LEVEL SECURITY;

-- Add basic indexes
CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON public.hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_case_emails_case_id ON public.case_emails(case_id);
CREATE INDEX IF NOT EXISTS idx_case_files_case_id ON public.case_files(case_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON public.case_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_court_hearings_case_id ON public.court_hearings(case_id);