-- Add organization_id column to zoho_tokens table
ALTER TABLE zoho_tokens
ADD COLUMN IF NOT EXISTS organization_id TEXT;