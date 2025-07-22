-- Add 'new' status to client_status_enum
ALTER TYPE client_status_enum ADD VALUE IF NOT EXISTS 'new';