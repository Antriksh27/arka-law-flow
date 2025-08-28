-- Update RLS policies for clients table to restrict junior access to assigned clients only
DROP POLICY IF EXISTS "clients_select_firm_members" ON public.clients;

CREATE POLICY "clients_select_firm_members" ON public.clients
FOR SELECT USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  ) AND (
    -- Juniors can only see clients assigned to them through cases
    CASE 
      WHEN (SELECT role FROM team_members WHERE user_id = auth.uid() LIMIT 1) = 'junior' THEN
        id IN (
          SELECT DISTINCT c.client_id 
          FROM cases c 
          WHERE c.client_id IS NOT NULL 
          AND (c.assigned_to = auth.uid() OR auth.uid() = ANY(c.assigned_users))
        )
      ELSE true -- Other roles can see all clients in their firm
    END
  )
);

-- Update RLS policies for cases table to restrict junior access to assigned cases only
DROP POLICY IF EXISTS "cases_select_firm_members" ON public.cases;

CREATE POLICY "cases_select_firm_members" ON public.cases
FOR SELECT USING (
  (
    firm_id IN (
      SELECT tm.firm_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid()
    ) AND (
      -- Juniors can only see cases they created or are assigned to
      CASE 
        WHEN (SELECT role FROM team_members WHERE user_id = auth.uid() LIMIT 1) = 'junior' THEN
          (auth.uid() = created_by OR auth.uid() = assigned_to OR auth.uid() = ANY(assigned_users))
        ELSE true -- Other roles can see all cases in their firm
      END
    )
  ) OR 
  (auth.uid() = created_by OR auth.uid() = assigned_to)
);

-- Add RLS policy for invoices to restrict access from juniors
CREATE POLICY "invoices_select_no_junior_access" ON public.invoices
FOR SELECT USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role != 'junior'
  )
);