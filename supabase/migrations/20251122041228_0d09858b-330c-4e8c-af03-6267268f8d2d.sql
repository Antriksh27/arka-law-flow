-- Phase 1: Supreme Court Data Integration - Database Schema
-- Add SC-specific fields to legalkart_cases table

ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS diary_number TEXT;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS diary_filed_on DATE;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS diary_section TEXT;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS diary_status TEXT;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS present_last_listed_on TIMESTAMP WITH TIME ZONE;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS bench_composition TEXT[];
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS case_status_detail TEXT;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS category_code TEXT;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS verification_date DATE;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS indexed_data JSONB;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS argument_transcripts JSONB;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS mention_memo JSONB;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS drop_note JSONB;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS caveat JSONB;

-- Table 1: sc_earlier_court_details - Lower court history
CREATE TABLE IF NOT EXISTS sc_earlier_court_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES legalkart_cases(id) ON DELETE CASCADE,
  sr_no INTEGER,
  court_type TEXT,
  agency_state TEXT,
  agency_code TEXT,
  case_no TEXT,
  order_date DATE,
  cnr_no TEXT,
  designation TEXT,
  judge1 TEXT,
  judge2 TEXT,
  judge3 TEXT,
  police_station TEXT,
  crime_no TEXT,
  crime_year INTEGER,
  authority_organisation TEXT,
  impugned_order_no TEXT,
  judgment_challenged BOOLEAN,
  judgment_type TEXT,
  judgment_covered_in TEXT,
  vehicle_number TEXT,
  reference_court TEXT,
  reference_state TEXT,
  reference_district TEXT,
  reference_no TEXT,
  relied_upon_court TEXT,
  relied_upon_state TEXT,
  relied_upon_district TEXT,
  relied_upon_no TEXT,
  transfer_to_state TEXT,
  transfer_to_district TEXT,
  transfer_to_no TEXT,
  govt_notification_state TEXT,
  govt_notification_no TEXT,
  govt_notification_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_earlier_courts_case ON sc_earlier_court_details(case_id);
CREATE INDEX IF NOT EXISTS idx_sc_earlier_courts_lk ON sc_earlier_court_details(legalkart_case_id);

-- Table 2: sc_tagged_matters
CREATE TABLE IF NOT EXISTS sc_tagged_matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES legalkart_cases(id) ON DELETE CASCADE,
  matter_type CHAR(1),
  tagged_case_number TEXT,
  tagged_case_registered_on TIMESTAMP WITH TIME ZONE,
  petitioner_vs_respondent TEXT,
  list_status CHAR(1),
  matter_status CHAR(1),
  stat_info TEXT,
  ia_info TEXT,
  entry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_tagged_case ON sc_tagged_matters(case_id);
CREATE INDEX IF NOT EXISTS idx_sc_tagged_lk ON sc_tagged_matters(legalkart_case_id);

-- Table 3: sc_listing_dates
CREATE TABLE IF NOT EXISTS sc_listing_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES legalkart_cases(id) ON DELETE CASCADE,
  cl_date DATE,
  misc_or_regular TEXT,
  stage TEXT,
  purpose TEXT,
  proposed_list_in TEXT,
  judge TEXT,
  judges TEXT[],
  ia TEXT,
  remarks TEXT,
  listed_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_listing_case ON sc_listing_dates(case_id);
CREATE INDEX IF NOT EXISTS idx_sc_listing_lk ON sc_listing_dates(legalkart_case_id);
CREATE INDEX IF NOT EXISTS idx_sc_listing_date ON sc_listing_dates(cl_date);

-- Table 4: sc_notices
CREATE TABLE IF NOT EXISTS sc_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES legalkart_cases(id) ON DELETE CASCADE,
  sr_no INTEGER,
  process_id TEXT,
  notice_type TEXT,
  name TEXT,
  state TEXT,
  district TEXT,
  station TEXT,
  issue_date DATE,
  returnable_date DATE,
  dispatch_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_notices_case ON sc_notices(case_id);
CREATE INDEX IF NOT EXISTS idx_sc_notices_lk ON sc_notices(legalkart_case_id);

-- Table 5: sc_defects
CREATE TABLE IF NOT EXISTS sc_defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES legalkart_cases(id) ON DELETE CASCADE,
  sr_no INTEGER,
  default_type TEXT,
  remarks TEXT,
  notification_date DATE,
  removed_on_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_defects_case ON sc_defects(case_id);
CREATE INDEX IF NOT EXISTS idx_sc_defects_lk ON sc_defects(legalkart_case_id);

-- Table 6: sc_judgement_orders
CREATE TABLE IF NOT EXISTS sc_judgement_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES legalkart_cases(id) ON DELETE CASCADE,
  order_date DATE,
  pdf_url TEXT,
  order_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_judgement_orders_case ON sc_judgement_orders(case_id);
CREATE INDEX IF NOT EXISTS idx_sc_judgement_orders_lk ON sc_judgement_orders(legalkart_case_id);
CREATE INDEX IF NOT EXISTS idx_sc_judgement_orders_date ON sc_judgement_orders(order_date);

-- Table 7: sc_office_reports
CREATE TABLE IF NOT EXISTS sc_office_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES legalkart_cases(id) ON DELETE CASCADE,
  sr_no INTEGER,
  process_id TEXT,
  order_date DATE,
  html_url TEXT,
  receiving_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_office_reports_case ON sc_office_reports(case_id);
CREATE INDEX IF NOT EXISTS idx_sc_office_reports_lk ON sc_office_reports(legalkart_case_id);

-- Table 8: sc_similarities
CREATE TABLE IF NOT EXISTS sc_similarities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  legalkart_case_id UUID REFERENCES legalkart_cases(id) ON DELETE CASCADE,
  category TEXT,
  similarity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_similarities_case ON sc_similarities(case_id);
CREATE INDEX IF NOT EXISTS idx_sc_similarities_lk ON sc_similarities(legalkart_case_id);

-- RLS Policies for all SC tables
ALTER TABLE sc_earlier_court_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_tagged_matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_listing_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_judgement_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_office_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_similarities ENABLE ROW LEVEL SECURITY;

-- Firm members can view SC data
CREATE POLICY "Firm members can view sc earlier courts" ON sc_earlier_court_details FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid()));

CREATE POLICY "Firm members can view sc tagged matters" ON sc_tagged_matters FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid()));

CREATE POLICY "Firm members can view sc listing dates" ON sc_listing_dates FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid()));

CREATE POLICY "Firm members can view sc notices" ON sc_notices FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid()));

CREATE POLICY "Firm members can view sc defects" ON sc_defects FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid()));

CREATE POLICY "Firm members can view sc judgement orders" ON sc_judgement_orders FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid()));

CREATE POLICY "Firm members can view sc office reports" ON sc_office_reports FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid()));

CREATE POLICY "Firm members can view sc similarities" ON sc_similarities FOR SELECT
  USING (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid()));

-- Authorized users can insert SC data
CREATE POLICY "Authorized users can insert sc earlier courts" ON sc_earlier_court_details FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')));

CREATE POLICY "Authorized users can insert sc tagged matters" ON sc_tagged_matters FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')));

CREATE POLICY "Authorized users can insert sc listing dates" ON sc_listing_dates FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')));

CREATE POLICY "Authorized users can insert sc notices" ON sc_notices FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')));

CREATE POLICY "Authorized users can insert sc defects" ON sc_defects FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')));

CREATE POLICY "Authorized users can insert sc judgement orders" ON sc_judgement_orders FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')));

CREATE POLICY "Authorized users can insert sc office reports" ON sc_office_reports FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')));

CREATE POLICY "Authorized users can insert sc similarities" ON sc_similarities FOR INSERT
  WITH CHECK (case_id IN (SELECT c.id FROM cases c JOIN team_members tm ON tm.firm_id = c.firm_id WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')));