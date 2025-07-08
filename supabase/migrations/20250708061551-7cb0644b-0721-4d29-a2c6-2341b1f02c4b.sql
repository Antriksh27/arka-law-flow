-- Create team member record for Bharat with receptionist role
-- First, ensure Bharat has a profile record
INSERT INTO public.profiles (id, full_name, email, role)
VALUES ('136899aa-4a45-4401-8ed2-94e6b9e147be', 'Bharat', 'bharat@hrulegal.com', 'receptionist')
ON CONFLICT (id) DO UPDATE
SET full_name = 'Bharat', email = 'bharat@hrulegal.com', role = 'receptionist';

-- Create team member record for Bharat
INSERT INTO public.team_members (user_id, firm_id, role, status, full_name, email, added_by, joined_at, created_at)
SELECT 
  '136899aa-4a45-4401-8ed2-94e6b9e147be',
  lf.id,
  'receptionist'::team_role_enum,
  'active'::team_member_status,
  'Bharat',
  'bharat@hrulegal.com',
  'beb69318-d69d-4b83-8ed2-e5bd277189c6',
  NOW(),
  NOW()
FROM law_firms lf
WHERE lf.admin_email = 'chitrajeetupadhyaya@yahoo.co.uk'
LIMIT 1;