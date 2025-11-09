-- Add by_against field to cases table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_by_against_enum') THEN
    CREATE TYPE case_by_against_enum AS ENUM ('by', 'against');
  END IF;
END $$;

ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS by_against case_by_against_enum;