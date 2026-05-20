-- Drop the old admin-only policy for clients
DROP POLICY IF EXISTS "clients_delete_admin_only" ON public.clients;

-- Create new policy allowing admins, reception, and office staff to delete clients (lawyers excluded)
CREATE POLICY "clients_delete_authorized_staff" ON public.clients
FOR DELETE
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'receptionist', 'office_staff')
  )
);

-- Update contacts delete policy to restrict lawyers
DROP POLICY IF EXISTS "Staff and receptionist can delete contacts" ON public.contacts;

CREATE POLICY "contacts_delete_authorized_staff" ON public.contacts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'receptionist', 'office_staff')
  )
);
