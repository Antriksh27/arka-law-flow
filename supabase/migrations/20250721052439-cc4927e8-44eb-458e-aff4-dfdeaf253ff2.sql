-- Create document_types table
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert document types
INSERT INTO public.document_types (name, category_code) VALUES
-- Pleadings
('Plaint / Petition', 'pleadings'),
('Written Statement', 'pleadings'),
('Affidavit', 'pleadings'),
('Rejoinder', 'pleadings'),

-- Evidence
('Evidence Document', 'evidence'),
('Witness Statement', 'evidence'),
('Photographs / Forensics', 'evidence'),

-- Court Filings
('Vakalatnama', 'court_filings'),
('Index / Checklist', 'court_filings'),
('Court Fee Receipt', 'court_filings'),

-- Client Documents
('Power of Attorney', 'client_documents'),
('Aadhaar / PAN', 'client_documents'),
('Deeds / Contracts', 'client_documents'),

-- Judicial Docs
('Court Orders', 'judicial_docs'),
('Judgments / Decrees', 'judicial_docs'),
('Certified Copies', 'judicial_docs'),

-- Internal / Drafts
('Draft Pleadings', 'internal_drafts'),
('Case Notes', 'internal_drafts'),
('Lawyer Instructions', 'internal_drafts'),

-- Miscellaneous
('Legal Notices', 'miscellaneous'),
('Police Reports / FIR', 'miscellaneous'),
('RTI Replies', 'miscellaneous'),
('Tribunal Submissions', 'miscellaneous');

-- Add new columns to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS document_type_id UUID REFERENCES public.document_types(id),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS confidential BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_copy_retained BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certified_copy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS uploaded_by_user_id UUID;

-- Update existing documents.uploaded_by to uploaded_by_user_id if needed
UPDATE public.documents 
SET uploaded_by_user_id = uploaded_by 
WHERE uploaded_by_user_id IS NULL AND uploaded_by IS NOT NULL;

-- Enable RLS on document_types
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

-- Create policy for document_types (readable by authenticated users)
CREATE POLICY "Document types are viewable by authenticated users" 
ON public.document_types 
FOR SELECT 
USING (auth.uid() IS NOT NULL);