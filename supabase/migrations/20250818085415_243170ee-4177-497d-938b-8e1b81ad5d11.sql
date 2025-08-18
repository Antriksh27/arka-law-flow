-- Drop all existing policies for invoice_items
DROP POLICY IF EXISTS "invoice_items_select_firm_members" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert_authorized" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update_authorized" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete_authorized" ON public.invoice_items;
DROP POLICY IF EXISTS "Firm members can view invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Admins can manage invoice items" ON public.invoice_items;

-- Create comprehensive policies for invoice_items
CREATE POLICY "invoice_items_select_firm_members" ON public.invoice_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT i.id FROM invoices i
      WHERE i.firm_id IN (
        SELECT tm.firm_id FROM team_members tm WHERE tm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "invoice_items_insert_authorized" ON public.invoice_items
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT i.id FROM invoices i
      WHERE i.firm_id IN (
        SELECT tm.firm_id FROM team_members tm 
        WHERE tm.user_id = auth.uid() AND tm.role = ANY(ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'office_staff'::team_role_enum])
      )
    )
  );

CREATE POLICY "invoice_items_update_authorized" ON public.invoice_items
  FOR UPDATE
  USING (
    invoice_id IN (
      SELECT i.id FROM invoices i
      WHERE i.firm_id IN (
        SELECT tm.firm_id FROM team_members tm 
        WHERE tm.user_id = auth.uid() AND tm.role = ANY(ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'office_staff'::team_role_enum])
      )
    )
  );

CREATE POLICY "invoice_items_delete_authorized" ON public.invoice_items
  FOR DELETE
  USING (
    invoice_id IN (
      SELECT i.id FROM invoices i
      WHERE i.firm_id IN (
        SELECT tm.firm_id FROM team_members tm 
        WHERE tm.user_id = auth.uid() AND tm.role = ANY(ARRAY['admin'::team_role_enum, 'lawyer'::team_role_enum, 'office_staff'::team_role_enum])
      )
    )
  );