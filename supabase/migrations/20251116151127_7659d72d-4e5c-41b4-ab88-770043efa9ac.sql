-- Step 1: Drop dependent views temporarily
DROP VIEW IF EXISTS client_stats CASCADE;

-- Step 2: Migrate existing case data to new status values
UPDATE cases 
SET status = 'pending'
WHERE status IN ('open', 'in_court', 'on_hold');

UPDATE cases 
SET status = 'disposed'
WHERE status = 'closed';

-- Step 3: Remove default constraint and change column to text
ALTER TABLE cases ALTER COLUMN status DROP DEFAULT;
ALTER TABLE cases ALTER COLUMN status TYPE text;

-- Step 4: Drop and recreate the enum type
DROP TYPE IF EXISTS case_status_enum CASCADE;
CREATE TYPE case_status_enum AS ENUM ('pending', 'disposed');

-- Step 5: Convert column back to enum and set default
ALTER TABLE cases 
ALTER COLUMN status TYPE case_status_enum 
USING status::case_status_enum;

ALTER TABLE cases 
ALTER COLUMN status SET DEFAULT 'pending'::case_status_enum;

-- Step 6: Recreate the client_stats view with updated status logic
CREATE VIEW client_stats AS
SELECT 
  c.id,
  c.full_name,
  c.email,
  c.phone,
  c.organization,
  c.status,
  c.created_at,
  c.updated_at,
  c.firm_id,
  COUNT(DISTINCT cases.id) FILTER (WHERE cases.status = 'pending') as active_cases_count,
  COUNT(DISTINCT cases.id) FILTER (WHERE cases.status = 'disposed') as closed_cases_count,
  COUNT(DISTINCT cases.id) as total_cases_count
FROM clients c
LEFT JOIN cases ON cases.client_id = c.id
GROUP BY c.id, c.full_name, c.email, c.phone, c.organization, c.status, c.created_at, c.updated_at, c.firm_id;