-- Add VIP field to clients table
ALTER TABLE clients ADD COLUMN is_vip boolean DEFAULT false;

-- Create index for faster VIP filtering
CREATE INDEX idx_clients_is_vip ON clients(is_vip) WHERE is_vip = true;