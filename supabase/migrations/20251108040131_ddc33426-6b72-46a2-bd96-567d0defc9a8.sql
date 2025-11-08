-- Drop existing policies
DROP POLICY IF EXISTS "Office staff can view internal notes" ON public.client_internal_notes;
DROP POLICY IF EXISTS "Office staff can create internal notes" ON public.client_internal_notes;
DROP POLICY IF EXISTS "Office staff can update internal notes" ON public.client_internal_notes;
DROP POLICY IF EXISTS "Office staff can delete internal notes" ON public.client_internal_notes;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND role = 'admin'
  )
$$;

-- RLS Policy: Office staff, admins, or note creator can view internal notes
CREATE POLICY "Authorized users can view internal notes"
ON public.client_internal_notes
FOR SELECT
TO authenticated
USING (
  public.is_office_staff(auth.uid()) 
  OR public.is_admin(auth.uid())
  OR created_by = auth.uid()
);

-- RLS Policy: Office staff, admins, or note creator can create internal notes
CREATE POLICY "Authorized users can create internal notes"
ON public.client_internal_notes
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_office_staff(auth.uid()) 
  OR public.is_admin(auth.uid())
  OR created_by = auth.uid()
);

-- RLS Policy: Office staff, admins, or note creator can update internal notes
CREATE POLICY "Authorized users can update internal notes"
ON public.client_internal_notes
FOR UPDATE
TO authenticated
USING (
  public.is_office_staff(auth.uid()) 
  OR public.is_admin(auth.uid())
  OR created_by = auth.uid()
);

-- RLS Policy: Office staff, admins, or note creator can delete internal notes
CREATE POLICY "Authorized users can delete internal notes"
ON public.client_internal_notes
FOR DELETE
TO authenticated
USING (
  public.is_office_staff(auth.uid()) 
  OR public.is_admin(auth.uid())
  OR created_by = auth.uid()
);