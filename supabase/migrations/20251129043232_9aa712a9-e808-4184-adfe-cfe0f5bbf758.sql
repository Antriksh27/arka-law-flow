-- Create function to get or create a case-specific chat thread
CREATE OR REPLACE FUNCTION public.create_case_thread(p_case_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_thread_id uuid;
  v_case_title text;
  v_firm_id uuid;
  v_current_user_id uuid := auth.uid();
  v_assigned_lawyer_id uuid;
  v_team_member record;
BEGIN
  -- Check if a thread for this case already exists
  SELECT id INTO v_thread_id
  FROM message_threads
  WHERE related_case_id = p_case_id
  LIMIT 1;

  -- If thread exists, return it
  IF v_thread_id IS NOT NULL THEN
    -- Add current user as participant if not already
    INSERT INTO thread_participants (thread_id, user_id)
    VALUES (v_thread_id, v_current_user_id)
    ON CONFLICT (thread_id, user_id) DO NOTHING;
    
    RETURN v_thread_id;
  END IF;

  -- Get case details
  SELECT case_title, firm_id, assigned_to 
  INTO v_case_title, v_firm_id, v_assigned_lawyer_id
  FROM cases
  WHERE id = p_case_id;

  IF v_case_title IS NULL THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  -- Create new thread
  INSERT INTO message_threads (
    title,
    is_private,
    related_case_id,
    firm_id,
    created_by
  )
  VALUES (
    v_case_title,
    false,
    p_case_id,
    v_firm_id,
    v_current_user_id
  )
  RETURNING id INTO v_thread_id;

  -- Add current user as participant
  INSERT INTO thread_participants (thread_id, user_id)
  VALUES (v_thread_id, v_current_user_id);

  -- Add assigned lawyer if exists and different from current user
  IF v_assigned_lawyer_id IS NOT NULL AND v_assigned_lawyer_id != v_current_user_id THEN
    INSERT INTO thread_participants (thread_id, user_id)
    VALUES (v_thread_id, v_assigned_lawyer_id)
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END IF;

  -- Add all admins and lawyers from the same firm
  FOR v_team_member IN
    SELECT DISTINCT tm.user_id
    FROM team_members tm
    WHERE tm.firm_id = v_firm_id
      AND tm.role IN ('admin', 'lawyer', 'partner', 'associate')
      AND tm.user_id != v_current_user_id
      AND (tm.status IS NULL OR tm.status = 'active')
  LOOP
    INSERT INTO thread_participants (thread_id, user_id)
    VALUES (v_thread_id, v_team_member.user_id)
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END LOOP;

  RETURN v_thread_id;
END;
$function$;