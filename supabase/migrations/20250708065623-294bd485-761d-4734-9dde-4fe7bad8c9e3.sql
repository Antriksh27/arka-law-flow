-- Add Param Dave as a junior to the current firm
INSERT INTO team_members (
  id,
  user_id, 
  full_name, 
  role, 
  firm_id,
  status,
  created_at,
  updated_at
) VALUES (
  'dcd5f12c-5ab0-4603-bf79-71e891f5af98',
  '5b016c1f-5aec-4d09-963a-2411038f4876',
  'Param Dave',
  'junior',
  '3fea2896-1608-4fe3-a421-a0d252658ed0',
  'active',
  now(),
  now()
);