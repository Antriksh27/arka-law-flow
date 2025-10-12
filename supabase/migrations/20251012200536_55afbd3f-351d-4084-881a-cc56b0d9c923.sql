-- Fix notify_case_created function to avoid invalid reference to unnest in WHERE
CREATE OR REPLACE FUNCTION public.notify_case_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_ids uuid[];
  recipient_id uuid;
BEGIN
  -- Collect all recipients: assigned_to, assigned_users, and admin
  recipient_ids := ARRAY[]::uuid[];
  
  -- Add assigned_to
  IF NEW.assigned_to IS NOT NULL THEN
    recipient_ids := array_append(recipient_ids, NEW.assigned_to);
  END IF;
  
  -- Add assigned_users
  IF NEW.assigned_users IS NOT NULL AND array_length(NEW.assigned_users, 1) > 0 THEN
    recipient_ids := recipient_ids || NEW.assigned_users;
  END IF;
  
  -- Add all admins from the same firm
  FOR recipient_id IN 
    SELECT tm.user_id 
    FROM public.team_members tm 
    WHERE tm.firm_id = NEW.firm_id 
      AND tm.role = 'admin'
  LOOP
    recipient_ids := array_append(recipient_ids, recipient_id);
  END LOOP;
  
  -- Remove duplicates and nulls using explicit alias for unnest output
  recipient_ids := ARRAY(
    SELECT DISTINCT x
    FROM unnest(recipient_ids) AS x
    WHERE x IS NOT NULL
  );
  
  -- Insert notification for each recipient
  IF array_length(recipient_ids, 1) > 0 THEN
    INSERT INTO public.notifications (
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
      u,
      'case_created',
      'New Case Created',
      'Case ' || COALESCE(NEW.case_title, NEW.title) || ' has been created and assigned to you',
      NEW.id,
      'case',
      'normal',
      '/cases/' || NEW.id,
      jsonb_build_object('case_title', COALESCE(NEW.case_title, NEW.title), 'case_number', NEW.case_number),
      false
    FROM unnest(recipient_ids) AS u;
  END IF;
  
  RETURN NEW;
END;
$$;
