-- Add VIP field to contacts table
ALTER TABLE contacts ADD COLUMN is_vip boolean DEFAULT false;

-- Create index for faster VIP filtering
CREATE INDEX idx_contacts_is_vip ON contacts(is_vip) WHERE is_vip = true;