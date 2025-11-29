-- Drop and recreate the create_case_thread function without firm_id
DROP FUNCTION IF EXISTS create_case_thread(uuid);

CREATE OR REPLACE FUNCTION create_case_thread(p_case_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_thread_id uuid;
  v_case_title text;
  v_firm_id uuid;
  v_assigned_lawyer uuid;
BEGIN
  -- Check if thread already exists for this case
  SELECT id INTO v_thread_id
  FROM message_threads
  WHERE related_case_id = p_case_id;

  IF v_thread_id IS NOT NULL THEN
    RETURN v_thread_id;
  END IF;

  -- Get case details
  SELECT case_title, firm_id, assigned_to
  INTO v_case_title, v_firm_id, v_assigned_lawyer
  FROM cases
  WHERE id = p_case_id;

  -- Create new thread
  INSERT INTO message_threads (title, is_private, related_case_id)
  VALUES (
    COALESCE(v_case_title, 'Case Chat'),
    false,
    p_case_id
  )
  RETURNING id INTO v_thread_id;

  -- Add current user as participant
  INSERT INTO message_participants (thread_id, user_id)
  VALUES (v_thread_id, auth.uid())
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  -- Add assigned lawyer if exists
  IF v_assigned_lawyer IS NOT NULL THEN
    INSERT INTO message_participants (thread_id, user_id)
    VALUES (v_thread_id, v_assigned_lawyer)
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END IF;

  -- Add all firm admins and lawyers
  INSERT INTO message_participants (thread_id, user_id)
  SELECT v_thread_id, user_id
  FROM team_members
  WHERE firm_id = v_firm_id
    AND role IN ('admin', 'lawyer', 'partner', 'associate')
    AND status = 'active'
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  RETURN v_thread_id;
END;
$$;