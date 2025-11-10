-- Fix missing attachments column in case_emails
ALTER TABLE public.case_emails ADD COLUMN IF NOT EXISTS attachments TEXT[];