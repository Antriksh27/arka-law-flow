
-- Rename the existing enum type
ALTER TYPE public.team_member_role RENAME TO team_role_enum;

-- Alter the column to use the renamed enum with no data changes
ALTER TABLE public.team_members
  ALTER COLUMN role TYPE team_role_enum USING role::text::team_role_enum;
