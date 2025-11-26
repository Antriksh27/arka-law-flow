-- Add Supreme Court specific columns to legalkart_cases table
ALTER TABLE legalkart_cases
ADD COLUMN IF NOT EXISTS diary_number TEXT,
ADD COLUMN IF NOT EXISTS case_title TEXT,
ADD COLUMN IF NOT EXISTS case_number TEXT,
ADD COLUMN IF NOT EXISTS bench_composition TEXT,
ADD COLUMN IF NOT EXISTS argument_transcripts JSONB,
ADD COLUMN IF NOT EXISTS indexing JSONB,
ADD COLUMN IF NOT EXISTS mention_memo JSONB,
ADD COLUMN IF NOT EXISTS drop_note JSONB,
ADD COLUMN IF NOT EXISTS caveat JSONB;

-- Create index on diary_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_legalkart_cases_diary_number ON legalkart_cases(diary_number);

-- SC Earlier Court Details table
CREATE TABLE IF NOT EXISTS sc_earlier_court_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  serial_no TEXT,
  court TEXT,
  agency_state TEXT,
  agency_code TEXT,
  case_no TEXT,
  order_date DATE,
  cnr_no TEXT,
  judge1 TEXT,
  judge2 TEXT,
  judge3 TEXT,
  police_station TEXT,
  crime_no TEXT,
  crime_year TEXT,
  authority TEXT,
  judgment_challenged BOOLEAN,
  judgment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SC Tagged Matters table
CREATE TABLE IF NOT EXISTS sc_tagged_matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT,
  case_number TEXT,
  petitioner_vs_respondent TEXT,
  list TEXT,
  status TEXT,
  stat_info TEXT,
  ia TEXT,
  entry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SC Listing Dates table
CREATE TABLE IF NOT EXISTS sc_listing_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  cl_date DATE,
  misc_regular TEXT,
  stage TEXT,
  purpose TEXT,
  proposed_list_in TEXT,
  judges TEXT,
  ia TEXT,
  remarks TEXT,
  listed TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SC Notices table
CREATE TABLE IF NOT EXISTS sc_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  serial_number TEXT,
  process_id TEXT,
  notice_type TEXT,
  name TEXT,
  state_district TEXT,
  station TEXT,
  issue_date DATE,
  returnable_date DATE,
  dispatch_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SC Defects table
CREATE TABLE IF NOT EXISTS sc_defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  serial_no TEXT,
  defect TEXT,
  remarks TEXT,
  notification_date DATE,
  removed_on_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SC Judgement Orders table
CREATE TABLE IF NOT EXISTS sc_judgement_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  order_date DATE,
  order_url TEXT,
  order_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SC Office Reports table
CREATE TABLE IF NOT EXISTS sc_office_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  serial_number TEXT,
  process_id TEXT,
  order_date DATE,
  order_url TEXT,
  receiving_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SC Similarities table
CREATE TABLE IF NOT EXISTS sc_similarities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  category TEXT,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all SC tables
ALTER TABLE sc_earlier_court_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_tagged_matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_listing_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_judgement_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_office_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_similarities ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view SC data for cases in their firm
CREATE POLICY "Firm members can view sc_earlier_court_details"
  ON sc_earlier_court_details FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can view sc_tagged_matters"
  ON sc_tagged_matters FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can view sc_listing_dates"
  ON sc_listing_dates FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can view sc_notices"
  ON sc_notices FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can view sc_defects"
  ON sc_defects FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can view sc_judgement_orders"
  ON sc_judgement_orders FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can view sc_office_reports"
  ON sc_office_reports FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Firm members can view sc_similarities"
  ON sc_similarities FOR SELECT
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN team_members tm ON tm.firm_id = c.firm_id
      WHERE tm.user_id = auth.uid()
    )
  );