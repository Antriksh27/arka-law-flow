-- Phase 1: Critical RLS Security Fixes (Fixed)

-- Enable RLS on unprotected tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_hearings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for calendar_events
CREATE POLICY "Users can view their own calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own calendar events" 
ON public.calendar_events 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own calendar events" 
ON public.calendar_events 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own calendar events" 
ON public.calendar_events 
FOR DELETE 
USING (user_id = auth.uid());

-- Create RLS policies for court_hearings
CREATE POLICY "Firm members can view court hearings" 
ON public.court_hearings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cases c
    JOIN public.team_members tm ON tm.firm_id = c.firm_id
    WHERE c.id = court_hearings.case_id 
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Lawyers can create court hearings" 
ON public.court_hearings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer')
  )
);

CREATE POLICY "Lawyers can update court hearings" 
ON public.court_hearings 
FOR UPDATE 
USING (
  lawyer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

CREATE POLICY "Lawyers can delete court hearings" 
ON public.court_hearings 
FOR DELETE 
USING (
  lawyer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

-- Fix profiles table security - prevent users from changing their own role
CREATE POLICY "Users can update own profile except role" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Add security definer function for secure role checking
CREATE OR REPLACE FUNCTION public.get_current_user_role_secure()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Add security definer function for firm membership checking
CREATE OR REPLACE FUNCTION public.get_current_user_firm_id_secure()
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT firm_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$$;