-- =====================================================
-- Remove Duplicate Notification Triggers
-- =====================================================
-- This migration removes duplicate triggers that cause
-- multiple notifications for a single action
-- =====================================================

-- Drop all existing notification triggers on appointments
DROP TRIGGER IF EXISTS on_appointment_notification ON appointments;
DROP TRIGGER IF EXISTS on_appointment_created ON appointments;
DROP TRIGGER IF EXISTS on_appointment_updated ON appointments;
DROP TRIGGER IF EXISTS appointments_notification_trigger ON appointments;

-- Drop all existing notification triggers on tasks
DROP TRIGGER IF EXISTS on_task_notification ON tasks;
DROP TRIGGER IF EXISTS on_task_created ON tasks;
DROP TRIGGER IF EXISTS on_task_updated ON tasks;

-- Drop all existing notification triggers on hearings
DROP TRIGGER IF EXISTS on_hearing_notification ON hearings;
DROP TRIGGER IF EXISTS on_hearing_created ON hearings;
DROP TRIGGER IF EXISTS on_hearing_updated ON hearings;

-- Drop all existing notification triggers on documents
DROP TRIGGER IF EXISTS on_document_notification ON documents;
DROP TRIGGER IF EXISTS on_document_created ON documents;
DROP TRIGGER IF EXISTS on_document_uploaded ON documents;

-- Drop all existing notification triggers on cases
DROP TRIGGER IF EXISTS on_case_notification ON cases;
DROP TRIGGER IF EXISTS on_case_created ON cases;
DROP TRIGGER IF EXISTS on_case_updated ON cases;

-- Now create ONE trigger per table using the updated function
-- APPOINTMENTS
CREATE TRIGGER on_appointment_notification
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- TASKS
CREATE TRIGGER on_task_notification
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- HEARINGS
CREATE TRIGGER on_hearing_notification
AFTER INSERT OR UPDATE ON hearings
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- DOCUMENTS
CREATE TRIGGER on_document_notification
AFTER INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();

-- CASES
CREATE TRIGGER on_case_notification
AFTER INSERT OR UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION handle_notification_trigger();