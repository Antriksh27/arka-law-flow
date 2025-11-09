-- Create auto_refresh_logs table for tracking scheduled case refreshes
CREATE TABLE IF NOT EXISTS auto_refresh_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_date DATE NOT NULL,
  execution_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_hearings INT NOT NULL DEFAULT 0,
  cases_processed INT NOT NULL DEFAULT 0,
  cases_succeeded INT NOT NULL DEFAULT 0,
  cases_failed INT NOT NULL DEFAULT 0,
  cases_skipped INT NOT NULL DEFAULT 0,
  execution_duration_ms INT,
  error_details JSONB,
  success_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for quick date lookups
CREATE INDEX idx_auto_refresh_logs_date ON auto_refresh_logs(execution_date DESC);

-- Enable RLS
ALTER TABLE auto_refresh_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view auto refresh logs"
ON auto_refresh_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);