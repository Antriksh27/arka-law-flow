-- Create case_fetch_queue table for persistent queue management
CREATE TABLE IF NOT EXISTS case_fetch_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL,
  cnr_number TEXT NOT NULL,
  court_type TEXT NOT NULL,
  
  -- Queue management
  status TEXT NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 5,
  
  -- Processing metadata
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Timing
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  -- Context
  created_by UUID NOT NULL,
  batch_id UUID,
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_queue_status ON case_fetch_queue(status) WHERE status IN ('queued', 'processing');
CREATE INDEX IF NOT EXISTS idx_queue_priority ON case_fetch_queue(priority, queued_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_queue_firm ON case_fetch_queue(firm_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_batch ON case_fetch_queue(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_queue_retry ON case_fetch_queue(next_retry_at) WHERE status = 'failed' AND retry_count < max_retries;

-- Enable RLS
ALTER TABLE case_fetch_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view queue items for their firm"
  ON case_fetch_queue
  FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert queue items"
  ON case_fetch_queue
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    firm_id IN (
      SELECT firm_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their firm's queue items"
  ON case_fetch_queue
  FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their firm's queue items"
  ON case_fetch_queue
  FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Add columns to legalkart_case_searches for better tracking
ALTER TABLE legalkart_case_searches 
ADD COLUMN IF NOT EXISTS retry_attempt INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_duration_ms INTEGER,
ADD COLUMN IF NOT EXISTS queue_item_id UUID REFERENCES case_fetch_queue(id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_case_fetch_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_case_fetch_queue_updated_at
  BEFORE UPDATE ON case_fetch_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_case_fetch_queue_updated_at();