-- Create firm holidays table for firm-wide holidays that affect all lawyers and juniors
CREATE TABLE public.firm_holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id uuid NOT NULL,
  date date NOT NULL,
  name text NOT NULL,
  description text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(firm_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.firm_holidays ENABLE ROW LEVEL SECURITY;

-- Create policies for firm holidays
CREATE POLICY "Firm members can view firm holidays" 
ON public.firm_holidays 
FOR SELECT 
USING (firm_id IN ( 
  SELECT tm.firm_id 
  FROM team_members tm 
  WHERE tm.user_id = auth.uid()
));

CREATE POLICY "Admins can create firm holidays" 
ON public.firm_holidays 
FOR INSERT 
WITH CHECK (
  firm_id IN ( 
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
  ) AND created_by = auth.uid()
);

CREATE POLICY "Admins can update firm holidays" 
ON public.firm_holidays 
FOR UPDATE 
USING (
  firm_id IN ( 
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
  )
);

CREATE POLICY "Admins can delete firm holidays" 
ON public.firm_holidays 
FOR DELETE 
USING (
  firm_id IN ( 
    SELECT tm.firm_id 
    FROM team_members tm 
    WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
  )
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_firm_holidays_updated_at
  BEFORE UPDATE ON public.firm_holidays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contacts_updated_at();

-- Create index for better performance
CREATE INDEX idx_firm_holidays_firm_date ON public.firm_holidays(firm_id, date);