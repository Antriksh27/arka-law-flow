-- Add referred by fields to contacts table
ALTER TABLE public.contacts 
ADD COLUMN referred_by_name text,
ADD COLUMN referred_by_phone text;