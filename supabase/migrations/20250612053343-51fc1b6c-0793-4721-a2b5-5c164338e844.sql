
-- Add missing columns to hearings table
ALTER TABLE public.hearings 
ADD COLUMN bench text,
ADD COLUMN coram text,
ADD COLUMN firm_id uuid;
