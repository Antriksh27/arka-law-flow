-- Add RLS policies for message_threads table
CREATE POLICY "Users can read threads they participate in"
ON message_threads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM thread_participants
    WHERE thread_participants.thread_id = message_threads.id
    AND thread_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Case team members can read case threads"
ON message_threads FOR SELECT
USING (
  related_case_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM cases c
    JOIN team_members tm ON tm.firm_id = c.firm_id
    WHERE c.id = message_threads.related_case_id
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create threads"
ON message_threads FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Update create_case_thread function to add current user as participant
CREATE OR REPLACE FUNCTION create_case_thread(p_case_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread_id uuid;
  v_case_title text;
  v_current_user uuid;
BEGIN
  v_current_user := auth.uid();
  
  -- Check if thread already exists for this case
  SELECT id INTO v_thread_id
  FROM message_threads
  WHERE related_case_id = p_case_id;

  IF v_thread_id IS NOT NULL THEN
    -- Ensure current user is a participant
    INSERT INTO thread_participants (thread_id, user_id)
    VALUES (v_thread_id, v_current_user)
    ON CONFLICT DO NOTHING;
    
    RETURN v_thread_id;
  END IF;

  -- Get case title for thread name
  SELECT 
    COALESCE(petitioner, '') || ' Vs ' || COALESCE(respondent, '')
  INTO v_case_title
  FROM cases
  WHERE id = p_case_id;

  -- Create new thread
  INSERT INTO message_threads (title, is_private, related_case_id)
  VALUES (
    COALESCE(NULLIF(v_case_title, ' Vs '), 'Case Chat'),
    false,
    p_case_id
  )
  RETURNING id INTO v_thread_id;

  -- Add current user as participant
  INSERT INTO thread_participants (thread_id, user_id)
  VALUES (v_thread_id, v_current_user);

  RETURN v_thread_id;
END;
$$;

-- Add RLS policies for thread_participants table
CREATE POLICY "Users can view their thread participation"
ON thread_participants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can add participants to their threads"
ON thread_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM thread_participants tp
    WHERE tp.thread_id = thread_participants.thread_id
    AND tp.user_id = auth.uid()
  )
  OR auth.uid() IS NOT NULL
);