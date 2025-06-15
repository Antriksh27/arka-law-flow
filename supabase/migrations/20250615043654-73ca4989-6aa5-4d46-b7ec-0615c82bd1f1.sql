
-- Add a unique constraint to the firm name to ensure "HRU LEGAL" is one of a kind, if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'law_firms_name_key' AND conrelid = 'public.law_firms'::regclass
  ) THEN
    ALTER TABLE public.law_firms ADD CONSTRAINT law_firms_name_key UNIQUE (name);
  END IF;
END;
$$;

-- This migration will insert "HRU LEGAL" into the law_firms table if it doesn't already exist.
-- It assigns the very first user who signed up as the default creator and administrator for the firm.
-- This ensures that there is always at least one firm and it has an admin.
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Find the first user
  SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;
  
  -- If a user exists, try to insert the firm
  IF first_user_id IS NOT NULL THEN
    INSERT INTO public.law_firms (name, created_by, admin_id)
    VALUES ('HRU LEGAL', first_user_id, first_user_id)
    ON CONFLICT (name) DO NOTHING;
  END IF;
END;
$$;

-- Drop the function for creating new firms, as we now only support a single firm.
DROP FUNCTION IF EXISTS public.create_firm_and_assign_admin(text);
