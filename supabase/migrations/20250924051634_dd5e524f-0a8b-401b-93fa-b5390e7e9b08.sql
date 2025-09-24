-- Add business information fields to clients table
ALTER TABLE public.clients 
ADD COLUMN designation text,
ADD COLUMN company_address text,
ADD COLUMN company_phone text,
ADD COLUMN company_email text;