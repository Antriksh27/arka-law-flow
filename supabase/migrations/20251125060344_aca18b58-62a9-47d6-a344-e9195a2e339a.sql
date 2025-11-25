-- Add tables for SC IA Documents and Court Fees

-- Table for SC Interlocutory Application Documents
CREATE TABLE IF NOT EXISTS sc_ia_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES legalkart_cases(id) ON DELETE CASCADE,
  ia_number TEXT,
  document_type TEXT,
  filed_by TEXT,
  filing_date DATE,
  document_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sc_ia_documents_case ON sc_ia_documents(case_id);
CREATE INDEX idx_sc_ia_documents_lk ON sc_ia_documents(legalkart_case_id);

-- Table for SC Court Fees
CREATE TABLE IF NOT EXISTS sc_court_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES legalkart_cases(id) ON DELETE CASCADE,
  fee_type TEXT,
  amount DECIMAL(10,2),
  paid_date DATE,
  challan_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sc_court_fees_case ON sc_court_fees(case_id);
CREATE INDEX idx_sc_court_fees_lk ON sc_court_fees(legalkart_case_id);

-- RLS Policies
ALTER TABLE sc_ia_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_court_fees ENABLE ROW LEVEL SECURITY;

-- View policies
CREATE POLICY "Firm members can view sc ia documents" ON sc_ia_documents FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid()));

CREATE POLICY "Firm members can view sc court fees" ON sc_court_fees FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid()));

-- Insert policies
CREATE POLICY "Authorized users can insert sc ia documents" ON sc_ia_documents FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')));

CREATE POLICY "Authorized users can insert sc court fees" ON sc_court_fees FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')));