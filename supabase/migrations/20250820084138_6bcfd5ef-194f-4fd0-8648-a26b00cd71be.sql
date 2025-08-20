-- Remove GST/tax related columns from engagement_letters table
ALTER TABLE engagement_letters 
DROP COLUMN IF EXISTS tax_rate,
DROP COLUMN IF EXISTS including_tax;

-- Remove GST/tax related columns from invoices table if they exist
-- Note: We need to check if these columns exist first
DO $$
BEGIN
    -- Check if tax_rate column exists in invoices table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'invoices' AND column_name = 'tax_rate') THEN
        ALTER TABLE invoices DROP COLUMN tax_rate;
    END IF;
    
    -- Check if gst_rate column exists in invoices table  
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'invoices' AND column_name = 'gst_rate') THEN
        ALTER TABLE invoices DROP COLUMN gst_rate;
    END IF;
    
    -- Check if tax_amount column exists in invoices table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'invoices' AND column_name = 'tax_amount') THEN
        ALTER TABLE invoices DROP COLUMN tax_amount;
    END IF;
    
    -- Check if gst_amount column exists in invoices table
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'invoices' AND column_name = 'gst_amount') THEN
        ALTER TABLE invoices DROP COLUMN gst_amount;
    END IF;
END$$;