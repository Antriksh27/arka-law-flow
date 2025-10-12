-- Phase 5: Scheduled Reminders System

-- ========================================
-- REMINDER TRACKING TABLE
-- ========================================

-- Table to track sent reminders and prevent duplicates
CREATE TABLE IF NOT EXISTS public.notification_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'hearing', 'task', 'appointment'
  entity_id uuid NOT NULL,
  reminder_type text NOT NULL, -- '24h', '1h', '30m', etc.
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  firm_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(entity_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.notification_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Firm members can view reminders"
  ON public.notification_reminders
  FOR SELECT
  USING (
    firm_id IN (
      SELECT tm.firm_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert reminders"
  ON public.notification_reminders
  FOR INSERT
  WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_notification_reminders_entity ON public.notification_reminders(entity_type, entity_id);
CREATE INDEX idx_notification_reminders_sent_at ON public.notification_reminders(sent_at);

-- ========================================
-- SCHEDULED REMINDER FUNCTION
-- ========================================

-- Function to send hearing reminders
CREATE OR REPLACE FUNCTION public.send_hearing_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hearing_record RECORD;
  recipient_ids uuid[];
  case_info RECORD;
  reminder_type text;
  time_until_hearing interval;
BEGIN
  -- Find hearings in the next 24 hours that need reminders
  FOR hearing_record IN
    SELECT h.*, c.case_title, c.firm_id
    FROM hearings h
    JOIN cases c ON c.id = h.case_id
    WHERE h.hearing_date >= CURRENT_DATE
      AND h.hearing_date <= CURRENT_DATE + interval '2 days'
      AND h.status != 'completed'
  LOOP
    -- Calculate time until hearing
    time_until_hearing := (hearing_record.hearing_date + COALESCE(hearing_record.hearing_time, '10:00'::time)) - now();
    
    -- Determine reminder type based on time until hearing
    IF time_until_hearing <= interval '1 hour' AND time_until_hearing > interval '30 minutes' THEN
      reminder_type := '1h';
    ELSIF time_until_hearing <= interval '24 hours' AND time_until_hearing > interval '23 hours' THEN
      reminder_type := '24h';
    ELSE
      CONTINUE; -- Skip if not in reminder window
    END IF;
    
    -- Check if reminder already sent
    IF EXISTS (
      SELECT 1 FROM notification_reminders
      WHERE entity_id = hearing_record.id
        AND entity_type = 'hearing'
        AND reminder_type = send_hearing_reminders.reminder_type
    ) THEN
      CONTINUE; -- Skip if already sent
    END IF;
    
    -- Get all case members
    SELECT ARRAY(
      SELECT DISTINCT unnest(ARRAY[c.created_by, c.assigned_to] || COALESCE(c.assigned_users, ARRAY[]::uuid[]))
      FROM cases c
      WHERE c.id = hearing_record.case_id
    ) INTO recipient_ids;
    
    recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
    
    -- Insert notifications for each recipient
    IF array_length(recipient_ids, 1) > 0 THEN
      INSERT INTO notifications (
        recipient_id,
        notification_type,
        title,
        message,
        reference_id,
        category,
        priority,
        action_url,
        metadata,
        read
      )
      SELECT
        unnest(recipient_ids),
        'hearing_reminder',
        CASE 
          WHEN reminder_type = '1h' THEN 'Hearing in 1 Hour'
          WHEN reminder_type = '24h' THEN 'Hearing Tomorrow'
        END,
        'Reminder: Hearing for "' || hearing_record.case_title || '" is ' ||
        CASE 
          WHEN reminder_type = '1h' THEN 'in 1 hour'
          WHEN reminder_type = '24h' THEN 'tomorrow'
        END || ' at ' || hearing_record.court_name,
        hearing_record.id,
        'hearing',
        'high',
        '/cases/' || hearing_record.case_id || '?tab=hearings',
        jsonb_build_object(
          'case_title', hearing_record.case_title,
          'hearing_date', hearing_record.hearing_date,
          'hearing_time', hearing_record.hearing_time,
          'court_name', hearing_record.court_name,
          'reminder_type', reminder_type
        ),
        false;
      
      -- Mark reminder as sent
      INSERT INTO notification_reminders (entity_type, entity_id, reminder_type, firm_id)
      VALUES ('hearing', hearing_record.id, reminder_type, hearing_record.firm_id);
    END IF;
  END LOOP;
END;
$$;

-- Function to send task deadline reminders
CREATE OR REPLACE FUNCTION public.send_task_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_record RECORD;
  reminder_type text;
  time_until_due interval;
BEGIN
  -- Find tasks due in the next 24 hours
  FOR task_record IN
    SELECT t.*, c.case_title, c.firm_id
    FROM tasks t
    LEFT JOIN cases c ON c.id = t.case_id
    WHERE t.due_date >= CURRENT_DATE
      AND t.due_date <= CURRENT_DATE + interval '2 days'
      AND t.status != 'completed'
      AND t.assigned_to IS NOT NULL
  LOOP
    -- Calculate time until due
    time_until_due := task_record.due_date - CURRENT_DATE;
    
    -- Determine reminder type
    IF time_until_due <= interval '1 day' AND time_until_due > interval '12 hours' THEN
      reminder_type := '24h';
    ELSIF time_until_due <= interval '0 days' THEN
      reminder_type := 'overdue';
    ELSE
      CONTINUE;
    END IF;
    
    -- Check if reminder already sent
    IF EXISTS (
      SELECT 1 FROM notification_reminders
      WHERE entity_id = task_record.id
        AND entity_type = 'task'
        AND reminder_type = send_task_reminders.reminder_type
    ) THEN
      CONTINUE;
    END IF;
    
    -- Insert notification
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read
    )
    VALUES (
      task_record.assigned_to,
      'task_reminder',
      CASE 
        WHEN reminder_type = '24h' THEN 'Task Due Tomorrow'
        WHEN reminder_type = 'overdue' THEN 'Task Overdue'
      END,
      'Reminder: Task "' || task_record.title || '" is ' ||
      CASE 
        WHEN reminder_type = '24h' THEN 'due tomorrow'
        WHEN reminder_type = 'overdue' THEN 'overdue'
      END,
      task_record.id,
      'task',
      CASE WHEN reminder_type = 'overdue' THEN 'urgent' ELSE 'high' END,
      CASE 
        WHEN task_record.case_id IS NOT NULL THEN '/cases/' || task_record.case_id || '?tab=tasks'
        ELSE '/tasks'
      END,
      jsonb_build_object(
        'task_title', task_record.title,
        'due_date', task_record.due_date,
        'case_title', task_record.case_title,
        'reminder_type', reminder_type
      ),
      false
    );
    
    -- Mark reminder as sent
    INSERT INTO notification_reminders (entity_type, entity_id, reminder_type, firm_id)
    VALUES ('task', task_record.id, reminder_type, task_record.firm_id);
  END LOOP;
END;
$$;

-- Function to send appointment reminders
CREATE OR REPLACE FUNCTION public.send_appointment_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_record RECORD;
  recipient_ids uuid[];
  reminder_type text;
  time_until_appointment interval;
BEGIN
  -- Find appointments in the next 24 hours
  FOR appointment_record IN
    SELECT a.*, c.full_name as client_name
    FROM appointments a
    LEFT JOIN clients c ON c.id = a.client_id
    WHERE a.start_time >= now()
      AND a.start_time <= now() + interval '25 hours'
      AND a.status = 'upcoming'
  LOOP
    -- Calculate time until appointment
    time_until_appointment := appointment_record.start_time - now();
    
    -- Determine reminder type
    IF time_until_appointment <= interval '1 hour' AND time_until_appointment > interval '30 minutes' THEN
      reminder_type := '1h';
    ELSIF time_until_appointment <= interval '24 hours' AND time_until_appointment > interval '23 hours' THEN
      reminder_type := '24h';
    ELSE
      CONTINUE;
    END IF;
    
    -- Check if reminder already sent
    IF EXISTS (
      SELECT 1 FROM notification_reminders
      WHERE entity_id = appointment_record.id
        AND entity_type = 'appointment'
        AND reminder_type = send_appointment_reminders.reminder_type
    ) THEN
      CONTINUE;
    END IF;
    
    -- Determine recipients (lawyer and client if client_id exists)
    recipient_ids := ARRAY[]::uuid[];
    IF appointment_record.lawyer_id IS NOT NULL THEN
      recipient_ids := array_append(recipient_ids, appointment_record.lawyer_id);
    END IF;
    IF appointment_record.client_id IS NOT NULL THEN
      recipient_ids := array_append(recipient_ids, appointment_record.client_id);
    END IF;
    IF appointment_record.created_by IS NOT NULL THEN
      recipient_ids := array_append(recipient_ids, appointment_record.created_by);
    END IF;
    
    recipient_ids := ARRAY(SELECT DISTINCT unnest(recipient_ids) WHERE unnest IS NOT NULL);
    
    -- Insert notifications
    IF array_length(recipient_ids, 1) > 0 THEN
      INSERT INTO notifications (
        recipient_id,
        notification_type,
        title,
        message,
        reference_id,
        category,
        priority,
        action_url,
        metadata,
        read
      )
      SELECT
        unnest(recipient_ids),
        'appointment_reminder',
        CASE 
          WHEN reminder_type = '1h' THEN 'Appointment in 1 Hour'
          WHEN reminder_type = '24h' THEN 'Appointment Tomorrow'
        END,
        'Reminder: Appointment "' || appointment_record.title || '"' ||
        CASE 
          WHEN appointment_record.client_name IS NOT NULL THEN ' with ' || appointment_record.client_name
          ELSE ''
        END || ' is ' ||
        CASE 
          WHEN reminder_type = '1h' THEN 'in 1 hour'
          WHEN reminder_type = '24h' THEN 'tomorrow'
        END,
        appointment_record.id,
        'appointment',
        'high',
        '/appointments',
        jsonb_build_object(
          'appointment_title', appointment_record.title,
          'start_time', appointment_record.start_time,
          'client_name', appointment_record.client_name,
          'location', appointment_record.location,
          'reminder_type', reminder_type
        ),
        false;
      
      -- Mark reminder as sent
      INSERT INTO notification_reminders (entity_type, entity_id, reminder_type, firm_id)
      VALUES ('appointment', appointment_record.id, reminder_type, appointment_record.firm_id);
    END IF;
  END LOOP;
END;
$$;

-- ========================================
-- CRON JOBS SETUP
-- ========================================

-- Schedule hearing reminders to run every 30 minutes
SELECT cron.schedule(
  'send-hearing-reminders',
  '*/30 * * * *', -- Every 30 minutes
  $$SELECT public.send_hearing_reminders()$$
);

-- Schedule task reminders to run every hour
SELECT cron.schedule(
  'send-task-reminders',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT public.send_task_reminders()$$
);

-- Schedule appointment reminders to run every 30 minutes
SELECT cron.schedule(
  'send-appointment-reminders',
  '*/30 * * * *', -- Every 30 minutes
  $$SELECT public.send_appointment_reminders()$$
);