-- Create function to notify receptionist and office staff when new client is created
CREATE OR REPLACE FUNCTION public.notify_new_client_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  staff_member RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Create notification content
  notification_title := 'New Client Added';
  notification_message := 'A new client "' || NEW.full_name || '" has been added to the system.';
  
  -- Insert notifications for all receptionists and office staff in the same firm
  FOR staff_member IN 
    SELECT tm.user_id
    FROM team_members tm
    WHERE tm.firm_id = NEW.firm_id 
    AND tm.role IN ('receptionist', 'office_staff')
    AND tm.status = 'active'
  LOOP
    INSERT INTO notifications (
      recipient_id,
      notification_type,
      title,
      message,
      reference_id,
      read
    ) VALUES (
      staff_member.user_id,
      'client',
      notification_title,
      notification_message,
      NEW.id::text,
      false
    );
  END LOOP;
  
  -- Log the activity for audit purposes
  INSERT INTO audit_logs (
    entity_type,
    action,
    entity_id,
    user_id,
    details
  ) VALUES (
    'client',
    'new_client_notification_sent',
    NEW.id,
    NEW.created_by,
    jsonb_build_object(
      'client_name', NEW.full_name,
      'client_id', NEW.id,
      'firm_id', NEW.firm_id,
      'notification_sent_to_roles', ARRAY['receptionist', 'office_staff']
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire when a new client is inserted
CREATE TRIGGER trigger_notify_new_client_creation
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_client_creation();