-- Add 'new' status to client_status_enum
ALTER TYPE client_status_enum ADD VALUE IF NOT EXISTS 'new';

-- Update default status for clients table to 'new'
ALTER TABLE public.clients 
ALTER COLUMN status SET DEFAULT 'new'::client_status_enum;