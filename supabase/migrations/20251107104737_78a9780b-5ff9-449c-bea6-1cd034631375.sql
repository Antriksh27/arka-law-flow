-- Add pin_code column to clients table
ALTER TABLE public.clients
ADD COLUMN pin_code text;