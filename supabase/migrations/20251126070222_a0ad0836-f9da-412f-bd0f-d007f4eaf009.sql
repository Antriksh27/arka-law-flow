-- Add unique constraint on case_id in case_fetch_queue table
ALTER TABLE case_fetch_queue ADD CONSTRAINT case_fetch_queue_case_id_unique UNIQUE (case_id);

-- Queue the 11 failed cases from Nov 24-25 for immediate retry
INSERT INTO case_fetch_queue (case_id, cnr_number, court_type, firm_id, created_by, priority, status)
SELECT 
  lcs.case_id,
  lcs.cnr_number,
  lcs.search_type as court_type,
  lcs.firm_id,
  lcs.created_by,
  5 as priority, -- High priority for manual retry
  'pending' as status
FROM legalkart_case_searches lcs
WHERE lcs.case_id IN (
  '322b1a26-6d2d-4236-b86f-b74b9e9c2251',
  '181fcc48-a134-43a2-9249-28e5a8cb020e',
  '09f26f39-665a-40b4-bfae-03499d317cac',
  'ecc00d17-3c65-4cfb-8e67-3e0568c2d04e',
  '4077ff28-9e6a-4aa5-875f-94e3e3f1e87e',
  'aad6cee6-67a8-4638-82e2-dc28d0e5aaef',
  '56da9a46-f3c7-461a-9d69-6e48d3010775',
  '70a76411-69cf-4e09-b83f-0ffcc27ff8fb',
  '58f2b5c1-49b2-4dab-8d3c-d8bbb3f75e49',
  '5dcdba42-30a3-421e-b28d-cc4bc80c842e',
  '3e653aa7-2e1d-42ca-9775-1ae96eb2f5f4'
)
AND lcs.status = 'failed'
AND lcs.created_at >= '2024-11-24'
ON CONFLICT (case_id) DO NOTHING;