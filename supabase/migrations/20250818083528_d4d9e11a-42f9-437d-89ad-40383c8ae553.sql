-- Create engagement_letters table to store engagement letter details
CREATE TABLE public.engagement_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  firm_id UUID NOT NULL,
  case_id UUID NULL,
  
  -- Matter Details
  matter_title TEXT NOT NULL,
  case_number TEXT,
  primary_lawyer_name TEXT NOT NULL,
  court_name TEXT,
  
  -- Fee Structure
  professional_fee DECIMAL(12,2) DEFAULT 0,
  retainer_amount DECIMAL(12,2) DEFAULT 0,
  expenses DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  including_tax BOOLEAN NOT NULL DEFAULT false,
  
  -- Payment Details
  payment_schedule TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  
  -- Document Details
  issue_date DATE NOT NULL,
  scope_description TEXT NOT NULL,
  
  -- Status and Metadata
  status TEXT NOT NULL DEFAULT 'draft', -- draft, generated, signed
  generated_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Add RLS policies
ALTER TABLE public.engagement_letters ENABLE ROW LEVEL SECURITY;

-- Firm members can view engagement letters
CREATE POLICY "engagement_letters_select_firm_members" 
ON public.engagement_letters 
FOR SELECT 
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

-- Authorized staff can create engagement letters
CREATE POLICY "engagement_letters_insert_authorized" 
ON public.engagement_letters 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() 
  AND firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

-- Authorized staff can update engagement letters
CREATE POLICY "engagement_letters_update_authorized" 
ON public.engagement_letters 
FOR UPDATE 
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

-- Only admins can delete engagement letters
CREATE POLICY "engagement_letters_delete_admin" 
ON public.engagement_letters 
FOR DELETE 
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_engagement_letters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_engagement_letters_updated_at
  BEFORE UPDATE ON public.engagement_letters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_engagement_letters_updated_at();