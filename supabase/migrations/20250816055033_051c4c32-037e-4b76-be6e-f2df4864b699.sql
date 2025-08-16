-- Enable real-time for appointments table
ALTER TABLE appointments REPLICA IDENTITY FULL;

-- Add appointments table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;