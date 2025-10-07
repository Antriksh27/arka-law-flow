-- Add link columns to legalkart_case_documents table
ALTER TABLE legalkart_case_documents 
ADD COLUMN IF NOT EXISTS document_link TEXT,
ADD COLUMN IF NOT EXISTS pdf_base64 TEXT;

-- Add link columns to legalkart_case_orders table
ALTER TABLE legalkart_case_orders 
ADD COLUMN IF NOT EXISTS order_link TEXT,
ADD COLUMN IF NOT EXISTS pdf_base64 TEXT;