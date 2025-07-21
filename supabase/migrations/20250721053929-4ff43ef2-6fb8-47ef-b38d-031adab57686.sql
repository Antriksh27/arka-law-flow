-- First, let's see what storage policies exist for the documents bucket
-- Then create permissive policies for authenticated users

-- Allow authenticated users to select from documents bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can view documents"
ON storage.objects
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to download from documents bucket  
CREATE POLICY IF NOT EXISTS "Authenticated users can download documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to insert into documents bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);