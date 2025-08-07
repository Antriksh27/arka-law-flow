-- Clean up any contacts that were incorrectly marked as converted but not deleted
DELETE FROM contacts WHERE converted_to_client = true;

-- Remove the converted_to_client and converted_client_id columns from contacts table
-- These are no longer needed since contacts should be deleted upon conversion
ALTER TABLE contacts 
DROP COLUMN IF EXISTS converted_to_client,
DROP COLUMN IF EXISTS converted_client_id;