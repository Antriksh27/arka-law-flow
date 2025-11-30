-- Create client_users table to link clients to Supabase auth
CREATE TABLE IF NOT EXISTS public.client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  phone TEXT NOT NULL UNIQUE,
  auth_user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on client_users
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_users_phone ON public.client_users(phone);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON public.client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_auth_user_id ON public.client_users(auth_user_id);

-- Function to get client_id from authenticated user
CREATE OR REPLACE FUNCTION public.get_client_id_from_auth()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.client_users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Function to check if user is a client
CREATE OR REPLACE FUNCTION public.is_client_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_users 
    WHERE auth_user_id = auth.uid() AND is_active = true
  );
$$;

-- RLS Policies for client_users table
CREATE POLICY "Clients can view their own record"
  ON public.client_users
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- RLS Policy for cases - clients can only view their cases
CREATE POLICY "Clients can view their own cases"
  ON public.cases
  FOR SELECT
  USING (
    client_id = public.get_client_id_from_auth()
    OR
    EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy for case_hearings - clients can view hearings for their cases
CREATE POLICY "Clients can view hearings for their cases"
  ON public.case_hearings
  FOR SELECT
  USING (
    case_id IN (
      SELECT id FROM public.cases WHERE client_id = public.get_client_id_from_auth()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy for case_orders - clients can view orders for their cases
CREATE POLICY "Clients can view orders for their cases"
  ON public.case_orders
  FOR SELECT
  USING (
    case_id IN (
      SELECT id FROM public.cases WHERE client_id = public.get_client_id_from_auth()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy for documents - clients can only view documents shared with them
CREATE POLICY "Clients can view shared documents"
  ON public.documents
  FOR SELECT
  USING (
    (is_shared_with_client = true AND case_id IN (
      SELECT id FROM public.cases WHERE client_id = public.get_client_id_from_auth()
    ))
    OR
    EXISTS (
      SELECT 1 FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy for clients table - clients can view their own profile
CREATE POLICY "Clients can view their own profile"
  ON public.clients
  FOR SELECT
  USING (
    id = public.get_client_id_from_auth()
    OR
    EXISTS (
      SELECT 1 FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at on client_users
CREATE OR REPLACE FUNCTION public.update_client_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_client_users_updated_at
  BEFORE UPDATE ON public.client_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_users_updated_at();