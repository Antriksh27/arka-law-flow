
-- Drop the existing check constraint if it exists, to avoid errors if we run this multiple times
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add a new check constraint that allows the statuses used in the application
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('upcoming', 'pending', 'completed', 'cancelled', 'rescheduled'));

-- Also, let's ensure the column 'status' in 'appointments' table defaults to 'upcoming'
-- This aligns with the migration script's intent and the form's default.
ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'upcoming';
