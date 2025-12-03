-- Add unique constraint on client_id for upsert to work
ALTER TABLE public.client_users 
ADD CONSTRAINT client_users_client_id_unique UNIQUE (client_id);