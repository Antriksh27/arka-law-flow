-- Update existing Google Calendar settings to enable auto_sync
UPDATE google_calendar_settings 
SET auto_sync = true 
WHERE auto_sync = false OR auto_sync IS NULL;