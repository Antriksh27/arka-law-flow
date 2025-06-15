
CREATE OR REPLACE FUNCTION public.create_private_thread(p_other_user_id UUID)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_thread_id uuid;
  v_current_user_id uuid := auth.uid();
  v_firm_id uuid;
BEGIN
  -- Check if a DM thread between these two users already exists
  SELECT t.id INTO v_thread_id
  FROM message_threads t
  WHERE t.is_private = TRUE
    AND EXISTS (
      SELECT 1 FROM thread_participants tp
      WHERE tp.thread_id = t.id AND tp.user_id = v_current_user_id
    )
    AND EXISTS (
      SELECT 1 FROM thread_participants tp
      WHERE tp.thread_id = t.id AND tp.user_id = p_other_user_id
    )
    -- Make sure it's a 2-person chat
    AND (SELECT count(*) FROM thread_participants tp WHERE tp.thread_id = t.id) = 2
  LIMIT 1;

  -- If a thread exists, return its ID
  IF v_thread_id IS NOT NULL THEN
    RETURN v_thread_id;
  END IF;

  -- Get the current user's firm_id
  SELECT firm_id INTO v_firm_id
  FROM public.team_members 
  WHERE user_id = v_current_user_id
  LIMIT 1;

  -- If no firm_id is found, we cannot proceed.
  IF v_firm_id IS NULL THEN
    RAISE EXCEPTION 'Could not create thread. User is not part of any firm.';
  END IF;

  -- If no thread exists, create one
  INSERT INTO message_threads (created_by, firm_id, is_private)
  VALUES (v_current_user_id, v_firm_id, TRUE)
  RETURNING id INTO v_thread_id;
  
  -- If thread creation failed, handle it
  IF v_thread_id IS NULL THEN
    RAISE EXCEPTION 'Could not create thread for an unknown reason.';
  END IF;

  -- Add both users as participants
  INSERT INTO thread_participants (thread_id, user_id)
  VALUES (v_thread_id, v_current_user_id), (v_thread_id, p_other_user_id);

  RETURN v_thread_id;
END;
$$;
