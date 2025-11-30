-- Add relief column to case_hearings
ALTER TABLE case_hearings ADD COLUMN IF NOT EXISTS relief TEXT;

-- Drop and recreate daily_hearings_view with registration_number priority and relief
DROP VIEW IF EXISTS daily_hearings_view;

CREATE VIEW daily_hearings_view AS
SELECT
  h.id AS hearing_id,
  h.hearing_date,
  h.hearing_time,
  h.judge,
  COALESCE(h.court_name, c.court_name, c.court, INITCAP(c.court_type), 'Unknown Court') AS court_name,
  h.purpose_of_hearing,
  h.cause_list_type,
  h.status,
  h.notes AS hearing_notes,
  h.relief,
  h.bench,
  h.coram,
  h.firm_id,
  h.assigned_to,
  
  c.id AS case_id,
  COALESCE(c.registration_number, c.case_number) AS case_number,
  c.case_title,
  c.petitioner,
  c.respondent,
  c.petitioner_advocate,
  c.respondent_advocate,
  c.court_name AS case_court_name,
  c.advocate_name,
  
  tm.full_name AS assigned_lawyer_name,
  tm.user_id AS assigned_lawyer_user_id
FROM case_hearings h
JOIN cases c ON c.id = h.case_id
LEFT JOIN team_members tm ON tm.user_id = h.assigned_to;