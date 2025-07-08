-- Drop the existing constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT profiles_role_check;

-- Add the updated constraint with all valid roles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'user', 'assistant', 'moderator', 'super_admin', 'lawyer', 'paralegal', 'junior', 'office_staff', 'receptionist', 'client'));