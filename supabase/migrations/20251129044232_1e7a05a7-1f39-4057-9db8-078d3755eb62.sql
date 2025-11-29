-- Recreate create_case_thread function without message_participants
DROP FUNCTION IF EXISTS create_case_thread(uuid);

CREATE OR REPLACE FUNCTION create_case_thread(p_case_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread_id uuid;
  v_case_title text;
BEGIN
  -- Check if thread already exists for this case
  SELECT id INTO v_thread_id
  FROM message_threads
  WHERE related_case_id = p_case_id;

  IF v_thread_id IS NOT NULL THEN
    RETURN v_thread_id;
  END IF;

  -- Get case title
  SELECT case_title INTO v_case_title
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

  RETURN v_thread_id;
END;
$$;