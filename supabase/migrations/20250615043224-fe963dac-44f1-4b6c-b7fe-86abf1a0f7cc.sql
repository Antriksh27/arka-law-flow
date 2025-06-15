
-- Add 'pending' to the team_member_status enum if it doesn't already exist.
-- This makes it a valid status for new team member join requests.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending' AND enumtypid = 'public.team_member_status'::regtype) THEN
        ALTER TYPE public.team_member_status ADD VALUE 'pending';
    END IF;
END
$$;
