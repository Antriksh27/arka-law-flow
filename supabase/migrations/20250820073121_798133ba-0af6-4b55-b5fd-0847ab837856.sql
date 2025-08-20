-- Update default value for auto_sync column to true
ALTER TABLE google_calendar_settings 
ALTER COLUMN auto_sync SET DEFAULT true;

-- Update existing records to enable auto_sync by default
UPDATE google_calendar_settings 
SET auto_sync = true 
WHERE auto_sync = false;