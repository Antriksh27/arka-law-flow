-- Update display name in profiles table to ensure it's properly formatted
UPDATE public.profiles 
SET full_name = 'Chitrajeet Upadhyaya'
WHERE id = 'beb69318-d69d-4b83-8ed2-e5bd277189c6';

-- Update display name in team_members table (currently shows email as name)
UPDATE public.team_members 
SET full_name = 'Chitrajeet Upadhyaya'
WHERE user_id = 'beb69318-d69d-4b83-8ed2-e5bd277189c6';