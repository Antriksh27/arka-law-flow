-- Drop any existing policies first and recreate them
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can download documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;

-- Allow authenticated users to select from documents bucket
CREATE POLICY "Authenticated users can view documents"
ON storage.objects
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to insert into documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);