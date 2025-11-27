-- Add task-related notification event types to the enum
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'task_assigned';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'task_updated';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'task_completed';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'task_reminder';
ALTER TYPE notification_event_type ADD VALUE IF NOT EXISTS 'task_overdue';

-- Update category constraint to include 'task'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_category_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_category_check 
  CHECK (category IN ('case', 'hearing', 'document', 'invoice', 'message', 'system', 'task', 'appointment'));