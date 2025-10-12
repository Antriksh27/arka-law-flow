-- Phase 1: Update notifications table schema and create notification types enum

-- Add new columns to notifications table for better notification management
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('case', 'hearing', 'document', 'invoice', 'message', 'system')),
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Create notification event type enum
DO $$ BEGIN
  CREATE TYPE notification_event_type AS ENUM (
    -- Cases
    'case_created', 'case_updated', 'case_status_changed', 'case_closed', 'case_assigned',
    -- Hearings
    'hearing_scheduled', 'hearing_updated', 'hearing_reminder', 'hearing_cancelled',
    -- Documents
    'document_uploaded', 'document_deleted', 'document_shared',
    -- Invoices
    'invoice_created', 'invoice_paid', 'invoice_overdue', 'invoice_reminder',
    -- Messages
    'message_received', 'message_mention',
    -- System
    'user_added', 'role_changed', 'security_alert', 'client',
    -- Appointments
    'appointment'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Map any unmapped notification types to valid enum values
UPDATE notifications 
SET notification_type = 'client'
WHERE notification_type NOT IN (
  'case_created', 'case_updated', 'case_status_changed', 'case_closed', 'case_assigned',
  'hearing_scheduled', 'hearing_updated', 'hearing_reminder', 'hearing_cancelled',
  'document_uploaded', 'document_deleted', 'document_shared',
  'invoice_created', 'invoice_paid', 'invoice_overdue', 'invoice_reminder',
  'message_received', 'message_mention',
  'user_added', 'role_changed', 'security_alert', 'client', 'appointment'
);

-- Alter the column to use the enum type
ALTER TABLE notifications 
  ALTER COLUMN notification_type TYPE notification_event_type 
  USING notification_type::notification_event_type;