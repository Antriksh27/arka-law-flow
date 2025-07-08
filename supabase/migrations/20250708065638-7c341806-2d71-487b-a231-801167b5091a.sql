-- Add Param Dave as a junior to the current firm with email
INSERT INTO team_members (
  id,
  user_id, 
  full_name, 
  email,
  role, 
  firm_id,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5b016c1f-5aec-4d09-963a-2411038f4876',
  'Param Dave',
  'param.dave@hrulegal.com',
  'junior',
  '3fea2896-1608-4fe3-a421-a0d252658ed0',
  'active',
  now(),
  now()
);