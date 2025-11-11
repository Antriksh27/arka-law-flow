-- Add missing assigned_to column to hearings table
ALTER TABLE public.hearings 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);

-- Create index for assigned_to
CREATE INDEX IF NOT EXISTS idx_hearings_assigned_to ON public.hearings(assigned_to);
