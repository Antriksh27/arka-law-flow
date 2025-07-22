-- Add referral fields to clients table
ALTER TABLE public.clients 
ADD COLUMN referred_by_name TEXT,
ADD COLUMN referred_by_phone TEXT;