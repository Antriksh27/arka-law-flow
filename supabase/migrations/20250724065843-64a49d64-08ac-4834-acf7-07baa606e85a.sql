-- Create availability_rules table
CREATE TABLE public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  appointment_duration INTEGER NOT NULL DEFAULT 30, -- in minutes
  buffer_time INTEGER NOT NULL DEFAULT 0, -- in minutes
  max_appointments_per_day INTEGER DEFAULT NULL, -- NULL means no limit
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT valid_duration CHECK (appointment_duration > 0),
  CONSTRAINT valid_buffer CHECK (buffer_time >= 0)
);

-- Create availability_exceptions table
CREATE TABLE public.availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT true, -- true = blocked, false = available exception
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on both tables
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;

-- Create policies for availability_rules
CREATE POLICY "Users can view their own availability rules" 
ON public.availability_rules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own availability rules" 
ON public.availability_rules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability rules" 
ON public.availability_rules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability rules" 
ON public.availability_rules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for availability_exceptions
CREATE POLICY "Users can view their own availability exceptions" 
ON public.availability_exceptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own availability exceptions" 
ON public.availability_exceptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own availability exceptions" 
ON public.availability_exceptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own availability exceptions" 
ON public.availability_exceptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow team members to view availability rules for booking purposes
CREATE POLICY "Team members can view availability rules for booking" 
ON public.availability_rules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM team_members tm1, team_members tm2 
  WHERE tm1.user_id = auth.uid() 
  AND tm2.user_id = availability_rules.user_id 
  AND tm1.firm_id = tm2.firm_id
));

-- Allow team members to view availability exceptions for booking purposes
CREATE POLICY "Team members can view availability exceptions for booking" 
ON public.availability_exceptions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM team_members tm1, team_members tm2 
  WHERE tm1.user_id = auth.uid() 
  AND tm2.user_id = availability_exceptions.user_id 
  AND tm1.firm_id = tm2.firm_id
));

-- Create indexes for better performance
CREATE INDEX idx_availability_rules_user_day ON public.availability_rules(user_id, day_of_week);
CREATE INDEX idx_availability_exceptions_user_date ON public.availability_exceptions(user_id, date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_availability_rules_updated_at
BEFORE UPDATE ON public.availability_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_availability_updated_at();

CREATE TRIGGER update_availability_exceptions_updated_at
BEFORE UPDATE ON public.availability_exceptions
FOR EACH ROW
EXECUTE FUNCTION public.update_availability_updated_at();