-- Phase 2 Fixed: Enable RLS on remaining tables with correct column names

-- Enable RLS on remaining tables that need it
DO $$ 
BEGIN
    -- Check if tables exist before enabling RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items' AND table_schema = 'public') THEN
        ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
        ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes' AND table_schema = 'public') THEN
        ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'public_appointments' AND table_schema = 'public') THEN
        ALTER TABLE public.public_appointments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for invoice_items (using correct columns)
CREATE POLICY "Firm members can view invoice items" 
ON public.invoice_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE i.id = invoice_items.invoice_id 
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage invoice items" 
ON public.invoice_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE i.id = invoice_items.invoice_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

-- Create RLS policies for invoices (using correct columns)
CREATE POLICY "Firm members can view invoices" 
ON public.invoices 
FOR SELECT 
USING (
  firm_id IN (
    SELECT tm.firm_id FROM public.team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "Invoice creators and admins can manage invoices" 
ON public.invoices 
FOR ALL 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
    AND tm.firm_id = invoices.firm_id
  )
);

-- Create RLS policies for notes (using author_id instead of created_by)
CREATE POLICY "Note authors can view their own notes" 
ON public.notes 
FOR SELECT 
USING (author_id = auth.uid());

CREATE POLICY "Note authors can manage their own notes" 
ON public.notes 
FOR ALL 
USING (author_id = auth.uid());

CREATE POLICY "Case team members can view case notes" 
ON public.notes 
FOR SELECT 
USING (
  case_id IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.cases c
    JOIN public.team_members tm ON tm.firm_id = c.firm_id
    WHERE c.id = notes.case_id 
    AND tm.user_id = auth.uid()
  )
);

-- Create RLS policies for payments (using correct columns)
CREATE POLICY "Invoice team members can view payments" 
ON public.payments 
FOR SELECT 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer')
  )
);

CREATE POLICY "Payment creators and admins can manage payments" 
ON public.payments 
FOR ALL 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);

-- Create RLS policies for public_appointments
CREATE POLICY "Public appointments are viewable by all" 
ON public.public_appointments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create public appointments" 
ON public.public_appointments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Lawyers can update public appointments" 
ON public.public_appointments 
FOR UPDATE 
USING (
  lawyer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer')
    AND tm.firm_id = public_appointments.firm_id
  )
);