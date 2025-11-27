-- Function to create notification when task is assigned
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_title_text TEXT;
  assigner_name TEXT;
BEGIN
  -- Only create notification if assigned_to has changed or is newly set
  IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL) THEN
    
    -- Don't notify if the user assigned the task to themselves
    IF NEW.assigned_to = NEW.created_by THEN
      RETURN NEW;
    END IF;
    
    -- Get task title (truncate if too long)
    task_title_text := COALESCE(NEW.title, 'Untitled Task');
    IF LENGTH(task_title_text) > 50 THEN
      task_title_text := SUBSTRING(task_title_text, 1, 47) || '...';
    END IF;
    
    -- Get the name of the person who assigned the task
    SELECT COALESCE(full_name, email, 'Someone') INTO assigner_name
    FROM profiles
    WHERE id = NEW.created_by
    LIMIT 1;
    
    -- Insert notification
    INSERT INTO notifications (
      recipient_id,
      title,
      message,
      notification_type,
      reference_id,
      category,
      priority,
      action_url,
      metadata,
      read,
      dismissed
    ) VALUES (
      NEW.assigned_to,
      'New Task Assigned',
      assigner_name || ' assigned you a task: ' || task_title_text,
      'task_assigned',
      NEW.id::text,
      'task',
      CASE 
        WHEN NEW.priority = 'high' THEN 'high'
        WHEN NEW.priority = 'urgent' THEN 'urgent'
        ELSE 'medium'
      END,
      '/tasks',
      jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'due_date', NEW.due_date,
        'assigned_by', NEW.created_by,
        'case_id', NEW.case_id
      ),
      false,
      false
    );
    
    RAISE LOG 'Task assignment notification created for user % (task: %)', NEW.assigned_to, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for task assignments
DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON tasks;
CREATE TRIGGER trigger_notify_task_assignment
  AFTER INSERT OR UPDATE OF assigned_to
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignment();

-- Add comment for documentation
COMMENT ON FUNCTION notify_task_assignment() IS 'Creates a notification when a task is assigned to a user';