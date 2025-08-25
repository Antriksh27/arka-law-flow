-- Update Chitrajeet's role in the profiles table to match team_members
UPDATE profiles 
SET role = 'admin'
WHERE id = (
  SELECT user_id FROM team_members 
  WHERE role = 'admin' 
  AND user_id IN (
    SELECT id FROM auth.users 
    WHERE email ILIKE '%chitrajeet%' OR email ILIKE '%upadhyaya%'
  )
  LIMIT 1
);