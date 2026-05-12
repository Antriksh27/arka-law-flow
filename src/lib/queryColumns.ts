/**
 * Centralized SELECT column lists for high-traffic queries.
 * Keeps list-view payloads small and consistent across the app.
 */

// `appointment_details` view (used by lists, calendars, sidebars, reception views)
export const APPOINTMENT_DETAILS_COLUMNS =
  'id, title, appointment_date, appointment_time, duration_minutes, status, type, location, notes, client_id, client_name, case_id, case_title, lawyer_id, assigned_user_name, firm_id, created_at';

// Plain `appointments` table list columns (when not using the view)
export const APPOINTMENTS_LIST_COLUMNS =
  'id, title, appointment_date, appointment_time, duration_minutes, status, type, location, notes, client_id, case_id, lawyer_id, firm_id, start_time, end_time, created_at';
