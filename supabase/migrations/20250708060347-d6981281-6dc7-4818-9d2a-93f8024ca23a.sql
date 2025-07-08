-- 1. Update your profile to have lawyer specializations while keeping admin role
UPDATE public.profiles 
SET 
  role = 'admin',
  specializations = 'Corporate Law, Civil Litigation, Contract Law, Employment Law',
  bar_registration = 'Bar Council of India - Registration No: BCI/2014/LAW/12345',
  accepting_clients = true,
  experience_years = 15,
  bio = 'Experienced legal professional with expertise in corporate law and civil litigation. Dedicated to providing comprehensive legal solutions to clients.',
  jurisdiction = 'High Court of Delhi, Supreme Court of India'
WHERE id = 'beb69318-d69d-4b83-8ed2-e5bd277189c6';

-- 2. Create team member record for Param Dave in your firm
INSERT INTO public.team_members (
  user_id, 
  firm_id, 
  full_name, 
  email, 
  role, 
  status,
  added_by
) VALUES (
  '5b016c1f-5aec-4d09-963a-2411038f4876',
  '1e7d6484-f442-425d-af59-8fff2f6b0feb',
  'Param Dave',
  'paramdave@example.com',
  'junior',
  'active',
  'beb69318-d69d-4b83-8ed2-e5bd277189c6'
) ON CONFLICT (user_id, firm_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  status = EXCLUDED.status;