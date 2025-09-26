-- Create legalkart_case_searches table to track API requests and responses
CREATE TABLE IF NOT EXISTS public.legalkart_case_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  case_id UUID,
  cnr_number TEXT NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('high_court', 'district_court', 'supreme_court', 'gujarat_display_board', 'district_cause_list')),
  request_data JSONB,
  response_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable RLS on legalkart_case_searches
ALTER TABLE public.legalkart_case_searches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for legalkart_case_searches
CREATE POLICY "legalkart_searches_select_firm_members" ON public.legalkart_case_searches
  FOR SELECT USING (
    firm_id IN (
      SELECT tm.firm_id FROM team_members tm WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "legalkart_searches_insert_authorized" ON public.legalkart_case_searches
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    firm_id IN (
      SELECT tm.firm_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

CREATE POLICY "legalkart_searches_update_authorized" ON public.legalkart_case_searches
  FOR UPDATE USING (
    firm_id IN (
      SELECT tm.firm_id FROM team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

-- Add cnr_auto_fetch_enabled column to cases table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'cnr_auto_fetch_enabled') THEN
    ALTER TABLE public.cases ADD COLUMN cnr_auto_fetch_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add last_fetched_at column to cases table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'last_fetched_at') THEN
    ALTER TABLE public.cases ADD COLUMN last_fetched_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create function to trigger auto-fetch when CNR is added
CREATE OR REPLACE FUNCTION public.trigger_cnr_auto_fetch()
RETURNS TRIGGER AS $$
BEGIN
  -- If CNR number was added/changed and auto-fetch is enabled
  IF (OLD.cnr_number IS DISTINCT FROM NEW.cnr_number) AND 
     NEW.cnr_number IS NOT NULL AND 
     NEW.cnr_number != '' AND
     NEW.cnr_auto_fetch_enabled = true THEN
    
    -- Insert search request for all court types
    INSERT INTO public.legalkart_case_searches (
      firm_id, case_id, cnr_number, search_type, created_by
    ) VALUES 
      (NEW.firm_id, NEW.id, NEW.cnr_number, 'high_court', NEW.created_by),
      (NEW.firm_id, NEW.id, NEW.cnr_number, 'district_court', NEW.created_by),
      (NEW.firm_id, NEW.id, NEW.cnr_number, 'supreme_court', NEW.created_by);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-fetch
DROP TRIGGER IF EXISTS trigger_cnr_auto_fetch_on_cases ON public.cases;
CREATE TRIGGER trigger_cnr_auto_fetch_on_cases
  AFTER UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cnr_auto_fetch();

-- Create updated_at trigger for legalkart_case_searches
CREATE TRIGGER update_legalkart_case_searches_updated_at
  BEFORE UPDATE ON public.legalkart_case_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();