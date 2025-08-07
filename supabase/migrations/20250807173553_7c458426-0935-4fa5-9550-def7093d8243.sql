-- Add state and district fields to clients table for complete address information
ALTER TABLE public.clients 
ADD COLUMN state TEXT,
ADD COLUMN district TEXT;