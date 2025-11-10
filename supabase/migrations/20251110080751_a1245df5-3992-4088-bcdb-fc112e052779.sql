-- Add hearing_time column to case_hearings table
ALTER TABLE case_hearings 
ADD COLUMN hearing_time time without time zone DEFAULT '12:00:00';

-- Update all existing case_hearings records to have 12:00 PM as the time
UPDATE case_hearings 
SET hearing_time = '12:00:00' 
WHERE hearing_time IS NULL;

-- Add comment to document this column
COMMENT ON COLUMN case_hearings.hearing_time IS 'Time of hearing, defaults to 12:00 PM for eCourts data';