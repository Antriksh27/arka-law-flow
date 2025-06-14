
-- Step 0: Drop existing objects if they exist to ensure a clean slate

-- Drop functions first, as triggers might depend on them or they are being replaced
DROP FUNCTION IF EXISTS public.update_invoice_total_amount();
DROP FUNCTION IF EXISTS public.generate_firm_invoice_number();
-- Use CASCADE to remove the old generate_invoice_number and its dependent trigger
DROP FUNCTION IF EXISTS public.generate_invoice_number() CASCADE;

-- Drop triggers on 'invoices' table (if it exists and wasn't dropped by CASCADE)
DROP TRIGGER IF EXISTS set_invoice_number ON public.invoices;
DROP TRIGGER IF EXISTS handle_invoices_updated_at ON public.invoices;

-- Drop tables (this will also remove any triggers on these tables)
DROP TABLE IF EXISTS public.invoice_items;
DROP TABLE IF EXISTS public.invoices;

-- Drop ENUM type
DROP TYPE IF EXISTS public.invoice_status_enum;
DROP TYPE IF EXISTS public.invoice_status; -- The existing schema might have this if status was USER-DEFINED

-- Now, re-create the schema from scratch

-- Step 1: Create an ENUM type for invoice statuses
CREATE TYPE public.invoice_status_enum AS ENUM (
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled'
);

-- Step 2: Create the Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  title TEXT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  notes TEXT,
  total_amount NUMERIC(12, 2) DEFAULT 0.00,
  status public.invoice_status_enum NOT NULL DEFAULT 'draft',
  firm_id UUID NOT NULL REFERENCES public.law_firms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_invoice_number_per_firm UNIQUE (firm_id, invoice_number)
);

-- Step 3: Create the InvoiceItems table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  rate NUMERIC(10, 2) NOT NULL,
  amount NUMERIC(12, 2) GENERATED ALWAYS AS (NULLIF(quantity, 0) * NULLIF(rate, 0)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 4: Create a function to generate firm-specific invoice numbers
CREATE OR REPLACE FUNCTION public.generate_firm_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_val TEXT;
  next_seq_val_text TEXT;
BEGIN
  year_val := TO_CHAR(NEW.issue_date, 'YYYY');
  
  SELECT COALESCE(MAX( (REGEXP_MATCHES(invoice_number, '-' || year_val || '-(\d+)$'))[1]::integer ), 0) + 1
  INTO next_seq_val_text
  FROM public.invoices
  WHERE firm_id = NEW.firm_id
    AND invoice_number LIKE 'INV-' || year_val || '-%';
    
  IF next_seq_val_text IS NULL THEN 
    next_seq_val_text := '1';
  END IF;

  NEW.invoice_number := 'INV-' || year_val || '-' || LPAD(next_seq_val_text, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a trigger to auto-generate invoice_number before insert on Invoices
CREATE TRIGGER set_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
EXECUTE FUNCTION public.generate_firm_invoice_number();

-- Step 6: Triggers for updated_at timestamps
CREATE TRIGGER handle_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_invoice_items_updated_at
BEFORE UPDATE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Step 7: Trigger function to update invoice total_amount when invoice_items change
CREATE OR REPLACE FUNCTION public.update_invoice_total_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.invoices
    SET total_amount = (
      SELECT COALESCE(SUM(invoice_items.amount), 0.00)
      FROM public.invoice_items
      WHERE invoice_id = OLD.invoice_id
    )
    WHERE id = OLD.invoice_id;
    RETURN OLD;
  ELSE -- INSERT or UPDATE
    UPDATE public.invoices
    SET total_amount = (
      SELECT COALESCE(SUM(invoice_items.amount), 0.00)
      FROM public.invoice_items
      WHERE invoice_id = NEW.invoice_id
    )
    WHERE id = NEW.invoice_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Trigger to call update_invoice_total_amount
CREATE TRIGGER trigger_update_invoice_total
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_total_amount();

