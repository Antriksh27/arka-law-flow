-- Create function to check if current user is office staff (from team_members)
CREATE OR REPLACE FUNCTION public.is_current_user_office_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE user_id = auth.uid() AND role = 'office_staff'
  );
$$;

-- Drop existing document SELECT policy
DROP POLICY IF EXISTS "documents_select_firm_members" ON public.documents;

-- Create new policy with confidentiality logic
CREATE POLICY "documents_select_firm_members" ON public.documents
FOR SELECT USING (
  -- Must be in the same firm first
  firm_id IN (SELECT tm.firm_id FROM team_members tm WHERE tm.user_id = auth.uid())
  AND (
    -- Non-confidential documents: visible to all firm members
    confidential = false
    OR
    -- Confidential documents: only visible to uploader, admin, or office_staff
    (
      confidential = true
      AND (
        uploaded_by = auth.uid()
        OR is_current_user_admin_safe()
        OR is_current_user_office_staff()
      )
    )
  )
  -- OR client access (unchanged)
  OR (
    get_user_role(auth.uid()) = 'client' 
    AND is_shared_with_client = true 
    AND client_id = auth.uid()
  )
);