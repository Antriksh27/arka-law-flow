-- Create message_reactions table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_message_emoji UNIQUE(message_id, user_id, emoji)
);

-- Indexes for faster queries
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);

-- Enable realtime
ALTER TABLE message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- RLS Policies
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions on messages in threads they're part of
CREATE POLICY "Users can view reactions in their threads" ON message_reactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN thread_participants tp ON tp.thread_id = m.thread_id
      WHERE m.id = message_reactions.message_id
      AND tp.user_id = auth.uid()
    )
  );

-- Users can add reactions to messages in threads they're part of
CREATE POLICY "Users can add reactions in their threads" ON message_reactions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM messages m
      JOIN thread_participants tp ON tp.thread_id = m.thread_id
      WHERE m.id = message_reactions.message_id
      AND tp.user_id = auth.uid()
    )
  );

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions" ON message_reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- RLS policies for chat attachments storage
CREATE POLICY "Users can upload attachments to their threads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT thread_id::text FROM thread_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view attachments in their threads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT thread_id::text FROM thread_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[2]
);