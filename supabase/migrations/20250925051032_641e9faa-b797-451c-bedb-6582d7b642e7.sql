-- Change reference_id column from uuid to text in notifications table
ALTER TABLE public.notifications 
ALTER COLUMN reference_id TYPE TEXT;