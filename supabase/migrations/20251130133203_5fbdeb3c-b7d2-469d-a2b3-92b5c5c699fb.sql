-- Create daily_hearings_view for Daily Hearings Board
CREATE OR REPLACE VIEW daily_hearings_view AS
SELECT
  h.id AS hearing_id,
  h.hearing_date,
  h.hearing_time,
  h.judge,
  h.court_name,
  h.purpose_of_hearing,
  h.cause_list_type,
  h.status,
  h.notes AS hearing_notes,
  h.bench,
  h.coram,
  h.firm_id,
  h.assigned_to,
  
  c.id AS case_id,
  c.case_number,
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