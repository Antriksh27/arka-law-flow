-- Create client_lawyer_assignments junction table for many-to-many relationship
CREATE TABLE public.client_lawyer_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  lawyer_id UUID NOT NULL,
  firm_id UUID NOT NULL,
  assigned_by UUID,  
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique assignment per client-lawyer pair
  UNIQUE(client_id, lawyer_id)
);

-- Enable RLS
ALTER TABLE public.client_lawyer_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_lawyer_assignments
CREATE POLICY "Firm members can view client lawyer assignments"
ON public.client_lawyer_assignments
FOR SELECT
USING (firm_id IN (
  SELECT tm.firm_id FROM team_members tm WHERE tm.user_id = auth.uid()
));

CREATE POLICY "Authorized users can create client lawyer assignments"
ON public.client_lawyer_assignments
FOR INSERT
WITH CHECK (
  assigned_by = auth.uid() AND
  firm_id IN (
    SELECT tm.firm_id FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

CREATE POLICY "Authorized users can delete client lawyer assignments"
ON public.client_lawyer_assignments
FOR DELETE
USING (
  firm_id IN (
    SELECT tm.firm_id FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

-- Migrate existing assigned_lawyer_id data to new table
INSERT INTO public.client_lawyer_assignments (client_id, lawyer_id, firm_id, assigned_by)
SELECT 
  c.id as client_id,
  c.assigned_lawyer_id as lawyer_id,
  c.firm_id,
  c.created_by as assigned_by
FROM public.clients c
WHERE c.assigned_lawyer_id IS NOT NULL;

-- Create index for performance
CREATE INDEX idx_client_lawyer_assignments_client_id ON public.client_lawyer_assignments(client_id);
CREATE INDEX idx_client_lawyer_assignments_lawyer_id ON public.client_lawyer_assignments(lawyer_id);
CREATE INDEX idx_client_lawyer_assignments_firm_id ON public.client_lawyer_assignments(firm_id);