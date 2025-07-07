-- Add receptionist role to existing team_role_enum
ALTER TYPE public.team_role_enum ADD VALUE IF NOT EXISTS 'receptionist';