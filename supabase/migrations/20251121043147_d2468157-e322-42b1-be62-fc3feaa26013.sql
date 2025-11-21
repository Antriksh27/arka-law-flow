-- Clean up old 608 failed cases (don't retry them)
DELETE FROM case_fetch_queue 
WHERE status = 'failed' 
  AND created_at < '2025-11-10';

-- Add yesterday's 4 failed cases for one-time retry
INSERT INTO case_fetch_queue (case_id, cnr_number, court_type, status, retry_count, max_retries, priority, created_by, firm_id, queued_at)
SELECT 
  c.id,
  c.cnr_number,
  c.court_type,
  'queued',
  0,
  100,
  10, -- High priority for retries
  c.created_by,
  c.firm_id,
  NOW()
FROM cases c
WHERE c.id IN (
  '7e2e1d99-7c9c-4ab7-9cc7-4d2e6c769587',
  'fb41d2cb-0274-4474-b3ba-63c7787ac1de',
  '487fce9d-56e2-4cc8-b507-978168f75433',
  '7b973780-01cf-4b86-9531-1dded7ebaa39'
)
AND c.cnr_number IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM case_fetch_queue cfq 
  WHERE cfq.case_id = c.id 
  AND cfq.status IN ('queued', 'processing')
);

-- Create monitoring view for daily fetch statistics
CREATE OR REPLACE VIEW daily_fetch_summary AS
SELECT 
  execution_date,
  cases_succeeded as successful_fetches,
  cases_failed as failed_fetches,
  cases_processed as total_attempted,
  total_hearings,
  execution_duration_ms,
  CASE 
    WHEN cases_succeeded >= 35 THEN 'LIMIT_REACHED'
    WHEN cases_failed > 5 THEN 'HIGH_FAILURE_RATE'
    ELSE 'NORMAL'
  END as status,
  created_at
FROM auto_refresh_logs
ORDER BY execution_date DESC;