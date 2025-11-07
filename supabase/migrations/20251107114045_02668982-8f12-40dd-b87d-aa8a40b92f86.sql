-- Drop the client_stats view as it depends on assigned_lawyer_id
DROP VIEW IF EXISTS client_stats;

-- Drop the client_lawyer_assignments table as it's no longer used
DROP TABLE IF EXISTS client_lawyer_assignments;

-- Remove the assigned_lawyer_id column from clients table as it's no longer used
ALTER TABLE clients DROP COLUMN IF EXISTS assigned_lawyer_id;

-- Recreate the client_stats view without lawyer assignment fields
CREATE VIEW client_stats AS
SELECT 
  c.id,
  c.full_name,
  c.email,
  c.phone,
  c.status,
  c.firm_id,
  c.client_portal_enabled,
  c.created_at,
  COUNT(DISTINCT cases.id) AS active_case_count
FROM clients c
LEFT JOIN cases ON cases.client_id = c.id AND cases.status = 'open'
GROUP BY c.id, c.full_name, c.email, c.phone, c.status, c.firm_id, c.client_portal_enabled, c.created_at;