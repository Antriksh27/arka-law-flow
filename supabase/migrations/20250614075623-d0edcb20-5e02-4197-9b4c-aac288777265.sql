
-- Create a table for public appointment bookings
CREATE TABLE public.public_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  reason TEXT,
  case_title TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  firm_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS (Row Level Security) - this table should be publicly insertable but only viewable by authenticated users
ALTER TABLE public.public_appointments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert appointment requests (public booking)
CREATE POLICY "Anyone can create appointment requests" 
  ON public.public_appointments 
  FOR INSERT 
  WITH CHECK (true);

-- Only authenticated users (lawyers/staff) can view appointment requests
CREATE POLICY "Authenticated users can view appointment requests" 
  ON public.public_appointments 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users can update appointment requests (for status changes)
CREATE POLICY "Authenticated users can update appointment requests" 
  ON public.public_appointments 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_public_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_public_appointments_updated_at
    BEFORE UPDATE ON public.public_appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_public_appointments_updated_at();
