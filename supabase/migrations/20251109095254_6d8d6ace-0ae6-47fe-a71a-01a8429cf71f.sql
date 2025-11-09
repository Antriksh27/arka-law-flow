-- Add reference_number column to cases table
ALTER TABLE public.cases 
ADD COLUMN reference_number text;