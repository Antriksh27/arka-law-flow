-- Add receptionist role to existing roles and create contacts table

-- First, let's add the receptionist role to the existing role types
-- Update the enum to include receptionist role
ALTER TYPE public.team_role_enum ADD VALUE IF NOT EXISTS 'receptionist';

-- Create contacts table for pre-client management
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  visit_purpose text,
  notes text,
  last_visited_at timestamp with time zone DEFAULT now(),
  converted_to_client boolean DEFAULT false,
  converted_client_id uuid,
  firm_id uuid,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add created_by_user_id to appointments table for tracking who created the appointment
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id);

-- Enable RLS on contacts table
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts table
CREATE POLICY "Firm members can view contacts" 
ON public.contacts 
FOR SELECT 
USING (
  firm_id IN (
    SELECT tm.firm_id 
    FROM public.team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can insert contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'receptionist', 'office_staff')
  )
);

CREATE POLICY "Staff can update contacts" 
ON public.contacts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.role IN ('admin', 'lawyer', 'receptionist', 'office_staff')
  )
);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contacts_updated_at();

-- Add index for better performance
CREATE INDEX idx_contacts_firm_id ON public.contacts(firm_id);
CREATE INDEX idx_contacts_converted ON public.contacts(converted_to_client);