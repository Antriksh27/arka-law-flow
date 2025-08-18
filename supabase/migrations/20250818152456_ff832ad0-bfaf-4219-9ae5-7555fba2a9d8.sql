-- Add new fields to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS kind_attention TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS secondary_client_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS secondary_client_address TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS gstin TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_subject TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS signature_name TEXT;

-- Create flat fee items table
CREATE TABLE IF NOT EXISTS public.invoice_flat_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID,
  date DATE,
  fixed_fee_type TEXT,
  city TEXT,
  unit_rate DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  total DECIMAL(10,2) GENERATED ALWAYS AS (
    COALESCE(unit_rate, 0) - COALESCE(discount_amount, 0) - (COALESCE(unit_rate, 0) * COALESCE(discount_percentage, 0) / 100)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.invoice_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  owner_id UUID,
  date DATE,
  expense_type TEXT,
  amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create adjustments table
CREATE TABLE IF NOT EXISTS public.invoice_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  adjustment_type TEXT CHECK (adjustment_type IN ('addition', 'deduction')),
  adjustment_value DECIMAL(10,2) DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.invoice_flat_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for flat fees
CREATE POLICY "invoice_flat_fees_select_firm_members" ON public.invoice_flat_fees
FOR SELECT USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "invoice_flat_fees_insert_authorized" ON public.invoice_flat_fees
FOR INSERT WITH CHECK (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

CREATE POLICY "invoice_flat_fees_update_authorized" ON public.invoice_flat_fees
FOR UPDATE USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

CREATE POLICY "invoice_flat_fees_delete_authorized" ON public.invoice_flat_fees
FOR DELETE USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer')
  )
);

-- Create RLS policies for expenses
CREATE POLICY "invoice_expenses_select_firm_members" ON public.invoice_expenses
FOR SELECT USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "invoice_expenses_insert_authorized" ON public.invoice_expenses
FOR INSERT WITH CHECK (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

CREATE POLICY "invoice_expenses_update_authorized" ON public.invoice_expenses
FOR UPDATE USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

CREATE POLICY "invoice_expenses_delete_authorized" ON public.invoice_expenses
FOR DELETE USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer')
  )
);

-- Create RLS policies for adjustments
CREATE POLICY "invoice_adjustments_select_firm_members" ON public.invoice_adjustments
FOR SELECT USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "invoice_adjustments_insert_authorized" ON public.invoice_adjustments
FOR INSERT WITH CHECK (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

CREATE POLICY "invoice_adjustments_update_authorized" ON public.invoice_adjustments
FOR UPDATE USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
  )
);

CREATE POLICY "invoice_adjustments_delete_authorized" ON public.invoice_adjustments
FOR DELETE USING (
  invoice_id IN (
    SELECT i.id FROM public.invoices i
    JOIN public.team_members tm ON tm.firm_id = i.firm_id
    WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer')
  )
);

-- Update triggers for updated_at
CREATE TRIGGER update_invoice_flat_fees_updated_at
  BEFORE UPDATE ON public.invoice_flat_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_expenses_updated_at
  BEFORE UPDATE ON public.invoice_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoice_adjustments_updated_at
  BEFORE UPDATE ON public.invoice_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();