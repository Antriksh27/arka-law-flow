
-- Comprehensive fix for messaging Row Level Security policies.
-- This script drops all previous messaging policies and creates a new, non-recursive, and complete set.

-- 1. Drop all old policies to prevent conflicts.

-- Policies on `message_threads`
DROP POLICY IF EXISTS "Users can view threads they are participants in" ON public.message_threads;
DROP POLICY IF EXISTS "Users can create new threads" ON public.message_threads;
DROP POLICY IF EXISTS "Users can access their own message threads" ON public.message_threads; -- from previous fix attempt

-- Policies on `thread_participants`
DROP POLICY IF EXISTS "Users can view participants of their threads" ON public.thread_participants;
DROP POLICY IF EXISTS "Users can add participants to new threads" ON public.thread_participants;

-- Policies on `messages`
DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their threads" ON public.messages;
DROP POLICY IF EXISTS "Users can access messages in their threads" ON public.messages; -- from previous fix attempt


-- 2. Re-create the `is_participant` helper function to be safe.

-- Drop the old helper function if it exists from a previous failed migration
DROP FUNCTION IF EXISTS public.my_thread_ids();

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

-- 3. Create the definitive new set of policies.

-- Policies for `message_threads`
CREATE POLICY "Users can view their own message threads"
ON public.message_threads FOR SELECT
USING ( public.is_participant(auth.uid(), id) );

CREATE POLICY "Users can create new message threads"
ON public.message_threads FOR INSERT
WITH CHECK (created_by = auth.uid());


-- Policies for `thread_participants`
CREATE POLICY "Users can view participants of their threads"
ON public.thread_participants FOR SELECT
USING ( public.is_participant(auth.uid(), thread_id) );

CREATE POLICY "Users can add participants to threads"
ON public.thread_participants FOR INSERT
WITH CHECK (
  (user_id = auth.uid()) OR
  (EXISTS (
      SELECT 1 FROM public.message_threads mt
      WHERE mt.id = thread_participants.thread_id AND mt.created_by = auth.uid()
  ))
);

-- Policies for `messages`
CREATE POLICY "Users can manage messages in their threads"
ON public.messages FOR ALL
USING ( public.is_participant(auth.uid(), thread_id) )
WITH CHECK ( public.is_participant(auth.uid(), thread_id) AND sender_id = auth.uid() );
