-- Create states table
CREATE TABLE public.states (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE
);

-- Create districts table  
CREATE TABLE public.districts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE CASCADE
);

-- Add address fields to contacts table
ALTER TABLE public.contacts 
ADD COLUMN address_line_1 text,
ADD COLUMN address_line_2 text,
ADD COLUMN pin_code text,
ADD COLUMN district_id uuid REFERENCES public.districts(id),
ADD COLUMN state_id uuid REFERENCES public.states(id);

-- Insert some sample Indian states
INSERT INTO public.states (name) VALUES 
('Andhra Pradesh'),
('Arunachal Pradesh'),
('Assam'),
('Bihar'),
('Chhattisgarh'),
('Goa'),
('Gujarat'),
('Haryana'),
('Himachal Pradesh'),
('Jharkhand'),
('Karnataka'),
('Kerala'),
('Madhya Pradesh'),
('Maharashtra'),
('Manipur'),
('Meghalaya'),
('Mizoram'),
('Nagaland'),
('Odisha'),
('Punjab'),
('Rajasthan'),
('Sikkim'),
('Tamil Nadu'),
('Telangana'),
('Tripura'),
('Uttar Pradesh'),
('Uttarakhand'),
('West Bengal'),
('Delhi'),
('Jammu and Kashmir'),
('Ladakh'),
('Puducherry'),
('Chandigarh'),
('Dadra and Nagar Haveli and Daman and Diu'),
('Lakshadweep'),
('Andaman and Nicobar Islands');

-- Insert sample districts for a few states (you can add more as needed)
INSERT INTO public.districts (name, state_id) VALUES 
-- Maharashtra districts
('Mumbai City', (SELECT id FROM public.states WHERE name = 'Maharashtra')),
('Mumbai Suburban', (SELECT id FROM public.states WHERE name = 'Maharashtra')),
('Pune', (SELECT id FROM public.states WHERE name = 'Maharashtra')),
('Nashik', (SELECT id FROM public.states WHERE name = 'Maharashtra')),
('Thane', (SELECT id FROM public.states WHERE name = 'Maharashtra')),
('Nagpur', (SELECT id FROM public.states WHERE name = 'Maharashtra')),

-- Delhi districts
('Central Delhi', (SELECT id FROM public.states WHERE name = 'Delhi')),
('East Delhi', (SELECT id FROM public.states WHERE name = 'Delhi')),
('New Delhi', (SELECT id FROM public.states WHERE name = 'Delhi')),
('North Delhi', (SELECT id FROM public.states WHERE name = 'Delhi')),
('North East Delhi', (SELECT id FROM public.states WHERE name = 'Delhi')),
('North West Delhi', (SELECT id FROM public.states WHERE name = 'Delhi')),
('Shahdara', (SELECT id FROM public.states WHERE name = 'Delhi')),
('South Delhi', (SELECT id FROM public.states WHERE name = 'Delhi')),
('South East Delhi', (SELECT id FROM public.states WHERE name = 'Delhi')),
('South West Delhi', (SELECT id FROM public.states WHERE name = 'Delhi')),
('West Delhi', (SELECT id FROM public.states WHERE name = 'Delhi')),

-- Karnataka districts
('Bangalore Urban', (SELECT id FROM public.states WHERE name = 'Karnataka')),
('Bangalore Rural', (SELECT id FROM public.states WHERE name = 'Karnataka')),
('Mysore', (SELECT id FROM public.states WHERE name = 'Karnataka')),
('Hubli-Dharwad', (SELECT id FROM public.states WHERE name = 'Karnataka')),
('Mangalore', (SELECT id FROM public.states WHERE name = 'Karnataka')),

-- Tamil Nadu districts  
('Chennai', (SELECT id FROM public.states WHERE name = 'Tamil Nadu')),
('Coimbatore', (SELECT id FROM public.states WHERE name = 'Tamil Nadu')),
('Madurai', (SELECT id FROM public.states WHERE name = 'Tamil Nadu')),
('Tiruchirappalli', (SELECT id FROM public.states WHERE name = 'Tamil Nadu')),
('Salem', (SELECT id FROM public.states WHERE name = 'Tamil Nadu'));

-- Enable RLS on new tables
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- Create policies for states (readable by everyone)
CREATE POLICY "States are viewable by everyone" 
ON public.states 
FOR SELECT 
USING (true);

-- Create policies for districts (readable by everyone)  
CREATE POLICY "Districts are viewable by everyone"
ON public.districts 
FOR SELECT 
USING (true);