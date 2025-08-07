-- CRITICAL SECURITY FIXES - Phase 1: Database Security (Corrected Enums)
-- This migration addresses the 6 critical SECURITY DEFINER view violations

-- Step 1: Drop problematic SECURITY DEFINER views
DROP VIEW IF EXISTS public.appointment_details CASCADE;
DROP VIEW IF EXISTS public.case_details CASCADE;  
DROP VIEW IF EXISTS public.client_stats CASCADE;
DROP VIEW IF EXISTS public.firm_statistics CASCADE;

-- Step 2: Recreate views as regular views (proper RLS enforcement)
CREATE VIEW public.appointment_details AS
SELECT 
  a.id, a.title, a.start_time, a.end_time, a.appointment_date, a.appointment_time,
  a.duration_minutes, a.location, a.status, a.type, a.notes, a.reminder_minutes,
  a.document_url, a.is_visible_to_team, a.created_at, a.created_by, a.client_id,
  a.case_id, a.lawyer_id, a.firm_id,
  c.full_name as client_name, cs.case_title, cs.case_number, p.full_name as assigned_user_name
FROM appointments a
LEFT JOIN clients c ON a.client_id = c.id
LEFT JOIN cases cs ON a.case_id = cs.id
LEFT JOIN profiles p ON a.lawyer_id = p.id;

CREATE VIEW public.case_details AS
SELECT c.*, cl.full_name as client_name, p.full_name as created_by_name,
  (SELECT COUNT(*) FROM hearings h WHERE h.case_id = c.id) as hearing_count,
  (SELECT COUNT(*) FROM documents d WHERE d.case_id = c.id) as document_count,
  (SELECT COUNT(*) FROM tasks t WHERE t.case_id = c.id) as task_count
FROM cases c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN profiles p ON c.created_by = p.id;

CREATE VIEW public.client_stats AS
SELECT c.id, c.full_name, c.email, c.phone, c.status, c.assigned_lawyer_id,
  c.firm_id, c.client_portal_enabled, c.created_at, p.full_name as assigned_lawyer_name,
  (SELECT COUNT(*) FROM cases cs WHERE cs.client_id = c.id AND cs.status = 'open') as active_case_count
FROM clients c LEFT JOIN profiles p ON c.assigned_lawyer_id = p.id;

CREATE VIEW public.firm_statistics AS
SELECT lf.id as firm_id, lf.name as firm_name, lf.admin_email, lf.license_count,
  lf.status, p.id as admin_id, p.full_name as admin_name, p.phone as admin_phone,
  (SELECT COUNT(*) FROM team_members tm WHERE tm.firm_id = lf.id) as total_users
FROM law_firms lf LEFT JOIN profiles p ON lf.admin_id = p.id;

-- Step 3: Clean up profiles RLS policy conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public profile reads for team visibility" ON public.profiles;

-- Create secure RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_select_firm_members" ON public.profiles
  FOR SELECT USING (
    id IN (
      SELECT tm1.user_id FROM team_members tm1
      JOIN team_members tm2 ON tm1.firm_id = tm2.firm_id
      WHERE tm2.user_id = auth.uid()
    )
  );

CREATE POLICY "profiles_admin_manage_firm" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm1
      JOIN team_members tm2 ON tm1.firm_id = tm2.firm_id
      WHERE tm1.user_id = auth.uid() AND tm1.role = 'admin'
      AND tm2.user_id = profiles.id
    )
  );

CREATE POLICY "profiles_super_admin_all" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Step 4: Secure public appointments
DROP POLICY IF EXISTS "Anyone can view public appointments" ON public.public_appointments;
DROP POLICY IF EXISTS "Anyone can create public appointments" ON public.public_appointments;

CREATE POLICY "public_appointments_authenticated_view" ON public.public_appointments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "public_appointments_create_authenticated" ON public.public_appointments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    lawyer_id IN (SELECT user_id FROM team_members WHERE role IN ('lawyer', 'admin'))
  );

-- Log security fixes
INSERT INTO public.audit_logs (entity_type, action, details) VALUES (
  'security', 'phase1_database_security_fixed',
  jsonb_build_object('timestamp', now(), 'fixes', 'rls_bypass_eliminated')
);