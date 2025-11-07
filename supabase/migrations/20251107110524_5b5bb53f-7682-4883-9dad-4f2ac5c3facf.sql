-- Add contact type and business fields to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'Individual',
ADD COLUMN IF NOT EXISTS designation text,
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS company_phone text,
ADD COLUMN IF NOT EXISTS company_email text;