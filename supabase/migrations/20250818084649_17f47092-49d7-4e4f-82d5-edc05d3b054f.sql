-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  firm_id UUID NOT NULL,
  title TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status invoice_status_enum NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create invoice status enum
CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- Create invoice items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "invoices_select_firm_members" ON public.invoices
  FOR SELECT
  USING (firm_id IN (
    SELECT tm.firm_id FROM team_members tm WHERE tm.user_id = auth.uid()
  ));

CREATE POLICY "invoices_insert_authorized" ON public.invoices
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    firm_id IN (
      SELECT tm.firm_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role = ANY(ARRAY['admin', 'lawyer', 'office_staff'])
    )
  );

CREATE POLICY "invoices_update_authorized" ON public.invoices
  FOR UPDATE
  USING (
    firm_id IN (
      SELECT tm.firm_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role = ANY(ARRAY['admin', 'lawyer', 'office_staff'])
    )
  );

CREATE POLICY "invoices_delete_admin" ON public.invoices
  FOR DELETE
  USING (
    firm_id IN (
      SELECT tm.firm_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  );

-- Create policies for invoice items
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
        WHERE tm.user_id = auth.uid() AND tm.role = ANY(ARRAY['admin', 'lawyer', 'office_staff'])
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
        WHERE tm.user_id = auth.uid() AND tm.role = ANY(ARRAY['admin', 'lawyer', 'office_staff'])
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
        WHERE tm.user_id = auth.uid() AND tm.role = ANY(ARRAY['admin', 'lawyer', 'office_staff'])
      )
    )
  );

-- Create function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_firm_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_val TEXT;
  next_seq_val_text TEXT;
BEGIN
  year_val := TO_CHAR(NEW.issue_date, 'YYYY');
  
  SELECT COALESCE(MAX( (REGEXP_MATCHES(invoice_number, '-' || year_val || '-(\d+)$'))[1]::integer ), 0) + 1
  INTO next_seq_val_text
  FROM invoices
  WHERE firm_id = NEW.firm_id
    AND invoice_number LIKE 'INV-' || year_val || '-%';
    
  IF next_seq_val_text IS NULL THEN 
    next_seq_val_text := '1';
  END IF;

  NEW.invoice_number := 'INV-' || year_val || '-' || LPAD(next_seq_val_text, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for invoice number generation
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_firm_invoice_number();

-- Create function to update invoice total when items change
CREATE OR REPLACE FUNCTION update_invoice_total_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE invoices
    SET total_amount = (
      SELECT COALESCE(SUM(invoice_items.amount), 0.00)
      FROM invoice_items
      WHERE invoice_id = OLD.invoice_id
    )
    WHERE id = OLD.invoice_id;
    RETURN OLD;
  ELSE -- INSERT or UPDATE
    UPDATE invoices
    SET total_amount = (
      SELECT COALESCE(SUM(invoice_items.amount), 0.00)
      FROM invoice_items
      WHERE invoice_id = NEW.invoice_id
    )
    WHERE id = NEW.invoice_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update invoice total
CREATE TRIGGER update_invoice_total
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_total_amount();

-- Create indexes for performance
CREATE INDEX idx_invoices_firm_id ON public.invoices(firm_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_case_id ON public.invoices(case_id);
CREATE INDEX idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);