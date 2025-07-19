-- Enable realtime for instructions table
ALTER TABLE public.instructions REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.instructions;