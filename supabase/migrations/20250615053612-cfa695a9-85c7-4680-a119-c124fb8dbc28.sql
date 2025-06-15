
-- Drop the old helper function if it exists from the previous failed migration
DROP FUNCTION IF EXISTS public.my_thread_ids();

-- Create a new helper function that checks if a user is a participant in a specific thread.
-- This function is `SECURITY DEFINER` to bypass RLS and prevent recursion.
-- It returns a simple boolean, which is allowed in policy expressions.
CREATE OR REPLACE FUNCTION public.is_participant(p_user_id uuid, p_thread_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.thread_participants
    WHERE thread_id = p_thread_id AND user_id = p_user_id
  );
$$;

-- RLS Policy for thread_participants
DROP POLICY IF EXISTS "Users can view participants of their threads" ON public.thread_participants;
CREATE POLICY "Users can view participants of their threads"
ON public.thread_participants
FOR SELECT
USING ( public.is_participant(auth.uid(), thread_id) );

-- RLS Policy for messages
DROP POLICY IF EXISTS "Users can access messages in their threads" ON public.messages;
CREATE POLICY "Users can access messages in their threads"
ON public.messages
FOR ALL
USING ( public.is_participant(auth.uid(), thread_id) )
WITH CHECK ( public.is_participant(auth.uid(), thread_id) );

-- RLS Policy for message_threads
DROP POLICY IF EXISTS "Users can access their own message threads" ON public.message_threads;
CREATE POLICY "Users can access their own message threads"
ON public.message_threads
FOR SELECT
USING ( public.is_participant(auth.uid(), id) );
