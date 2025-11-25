-- Add case_title and case_number columns to legalkart_cases table for Supreme Court case support
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS case_title TEXT;
ALTER TABLE legalkart_cases ADD COLUMN IF NOT EXISTS case_number TEXT;