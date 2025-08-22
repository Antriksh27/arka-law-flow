-- Update Chitrajeet Upadhyaya's role to admin for team management privileges
UPDATE team_members 
SET role = 'admin'::team_role_enum, updated_at = now()
WHERE id = 'c9a93117-66be-4780-a7e5-445597075b29';