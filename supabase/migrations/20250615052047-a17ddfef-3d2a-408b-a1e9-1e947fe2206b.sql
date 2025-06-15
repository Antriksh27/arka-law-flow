
-- Create a table to link users to message threads
CREATE TABLE public.thread_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT thread_participants_once UNIQUE (thread_id, user_id)
);

-- Enable RLS for all messaging tables
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for message_threads
-- Users can see threads they are part of.
CREATE POLICY "Users can view threads they are participants in"
  ON public.message_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_participants.thread_id = message_threads.id
      AND thread_participants.user_id = auth.uid()
    )
  );

-- Users can create new threads.
CREATE POLICY "Users can create new threads"
  ON public.message_threads FOR INSERT
  WITH CHECK (created_by = auth.uid());


-- Policies for thread_participants
-- Users can see participants of threads they are in.
CREATE POLICY "Users can view participants of their threads"
  ON public.thread_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants as tp
      WHERE tp.thread_id = thread_participants.thread_id
      AND tp.user_id = auth.uid()
    )
  );

-- Users can add participants when creating a thread.
CREATE POLICY "Users can add participants to new threads"
  ON public.thread_participants FOR INSERT
  WITH CHECK (
     -- The user creating the participant link must be the creator of the thread
    EXISTS (
      SELECT 1 FROM public.message_threads
      WHERE message_threads.id = thread_participants.thread_id
      AND message_threads.created_by = auth.uid()
    ) OR
    -- Or the user is adding themselves, which is necessary when joining a thread
    (thread_participants.user_id = auth.uid())
  );


-- Policies for messages
-- Users can see messages in threads they are part of.
CREATE POLICY "Users can view messages in their threads"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_participants.thread_id = messages.thread_id
      AND thread_participants.user_id = auth.uid()
    )
  );

-- Users can send messages in threads they are part of.
CREATE POLICY "Users can send messages in their threads"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_participants.thread_id = messages.thread_id
      AND thread_participants.user_id = auth.uid()
    )
  );
