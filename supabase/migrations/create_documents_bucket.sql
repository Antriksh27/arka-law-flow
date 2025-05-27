
-- Create documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for documents bucket
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Users can update their documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their documents" ON storage.objects
FOR DELETE USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
