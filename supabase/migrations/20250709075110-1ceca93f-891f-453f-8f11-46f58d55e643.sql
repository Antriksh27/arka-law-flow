-- Add arrived and late statuses to appointments status check constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add new constraint with arrived and late statuses
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('upcoming', 'completed', 'cancelled', 'rescheduled', 'in-progress', 'arrived', 'late'));