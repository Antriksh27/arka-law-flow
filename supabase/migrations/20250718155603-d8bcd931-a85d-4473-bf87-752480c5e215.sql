-- Create instructions table for lawyer-to-staff communication
CREATE TABLE public.instructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id UUID NOT NULL,
  staff_id UUID,
  case_id UUID,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed')),
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Lawyers can create instructions" 
ON public.instructions 
FOR INSERT 
WITH CHECK (
  lawyer_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer')
  )
);

CREATE POLICY "Staff can view their assigned instructions" 
ON public.instructions 
FOR SELECT 
USING (
  staff_id = auth.uid() 
  OR lawyer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'office_staff')
  )
);

CREATE POLICY "Staff can update their assigned instructions" 
ON public.instructions 
FOR UPDATE 
USING (
  staff_id = auth.uid() 
  OR lawyer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'office_staff')
  )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_instructions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_instructions_updated_at
  BEFORE UPDATE ON public.instructions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_instructions_updated_at();