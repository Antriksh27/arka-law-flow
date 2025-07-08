-- Update any invalid roles to a valid role first
UPDATE public.profiles 
SET role = 'office_staff' 
WHERE role = 'assistant';

-- Now drop and recreate the constraint with all valid roles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the updated constraint with all valid roles including receptionist
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'lawyer', 'paralegal', 'junior', 'office_staff', 'receptionist', 'client', 'super_admin'));