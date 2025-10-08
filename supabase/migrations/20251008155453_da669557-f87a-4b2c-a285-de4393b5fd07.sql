-- Create new tables directly linked to cases table

-- Documents table
CREATE TABLE IF NOT EXISTS case_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  sr_no text,
  document_filed text,
  filed_by text,
  advocate text,
  document_no text,
  date_of_receiving date,
  document_type text,
  document_url text,
  pdf_base64 text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS case_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  judge text,
  hearing_date date,
  order_date date,
  order_number text,
  bench text,
  order_details text,
  summary text,
  order_link text,
  pdf_base64 text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hearings table
CREATE TABLE IF NOT EXISTS case_hearings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  hearing_date date,
  judge text,
  cause_list_type text,
  business_on_date text,
  purpose_of_hearing text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Objections table
CREATE TABLE IF NOT EXISTS case_objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  sr_no text,
  objection text,
  receipt_date date,
  scrutiny_date date,
  compliance_date date,
  objection_compliance_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update existing tables to also link to cases (if column doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'petitioners' AND column_name = 'case_id') THEN
    ALTER TABLE petitioners ADD COLUMN case_id uuid REFERENCES cases(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'respondents' AND column_name = 'case_id') THEN
    ALTER TABLE respondents ADD COLUMN case_id uuid REFERENCES cases(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ia_details' AND column_name = 'case_id') THEN
    ALTER TABLE ia_details ADD COLUMN case_id uuid REFERENCES cases(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_case_orders_case_id ON case_orders(case_id);
CREATE INDEX IF NOT EXISTS idx_case_hearings_case_id ON case_hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_case_objections_case_id ON case_objections(case_id);
CREATE INDEX IF NOT EXISTS idx_petitioners_case_id ON petitioners(case_id);
CREATE INDEX IF NOT EXISTS idx_respondents_case_id ON respondents(case_id);
CREATE INDEX IF NOT EXISTS idx_ia_details_case_id ON ia_details(case_id);

-- Enable RLS
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_objections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_documents
CREATE POLICY "Firm members can view case documents" ON case_documents
  FOR SELECT USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can insert case documents" ON case_documents
  FOR INSERT WITH CHECK (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

-- RLS Policies for case_orders
CREATE POLICY "Firm members can view case orders" ON case_orders
  FOR SELECT USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can insert case orders" ON case_orders
  FOR INSERT WITH CHECK (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

-- RLS Policies for case_hearings
CREATE POLICY "Firm members can view case hearings" ON case_hearings
  FOR SELECT USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can insert case hearings" ON case_hearings
  FOR INSERT WITH CHECK (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

-- RLS Policies for case_objections
CREATE POLICY "Firm members can view case objections" ON case_objections
  FOR SELECT USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can insert case objections" ON case_objections
  FOR INSERT WITH CHECK (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );