-- First check what roles are currently allowed in profiles table
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND contype = 'c';

-- Update the profiles role check constraint to include all team roles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the updated constraint with all valid roles including receptionist
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'lawyer', 'paralegal', 'junior', 'office_staff', 'receptionist', 'client', 'super_admin'));