-- Phase 3: Fix remaining RLS issues and clean up conflicting policies

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies on profiles table to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;

-- Create comprehensive but secure RLS policies for profiles
CREATE POLICY "Users can view profiles in their firm" 
ON public.profiles 
FOR SELECT 
USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.team_members tm1, public.team_members tm2
    WHERE tm1.user_id = auth.uid() 
    AND tm2.user_id = profiles.id
    AND tm1.firm_id = tm2.firm_id
  )
);

CREATE POLICY "Users can update their own profile data" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Prevent role elevation - users cannot change their own role
  (OLD.role = NEW.role OR NEW.role IS NULL)
);

CREATE POLICY "Admins can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

CREATE POLICY "New users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

-- Clean up duplicate RLS policies on other tables
-- Remove overly broad policies that conflict with specific ones
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Find and drop policies with 'true' qualification (overly permissive)
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (
          policyname LIKE '%true%' OR 
          policyname LIKE '%all%clients%' OR
          policyname LIKE '%view all%'
        )
    LOOP
        -- Only drop if it's a problematic policy
        IF policy_record.policyname IN (
          'Users can view all clients',
          'Allow read access for users in same law firm',
          'Allow update for users in same law firm',
          'Allow insert for authenticated users',
          'Users can view all profiles',
          'Allow users to view all profiles'
        ) THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                          policy_record.policyname, 
                          policy_record.schemaname, 
                          policy_record.tablename);
        END IF;
    END LOOP;
END $$;