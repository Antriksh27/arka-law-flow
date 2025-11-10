-- Fix missing recipients column
ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS recipients TEXT[];