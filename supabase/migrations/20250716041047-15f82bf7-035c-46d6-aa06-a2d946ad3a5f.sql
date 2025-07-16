-- Insert Gujarat districts
INSERT INTO public.districts (name, state_id) VALUES 
('Ahmedabad', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Amreli', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Anand', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Aravalli', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Banaskantha (Palanpur)', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Bharuch', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Bhavnagar', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Botad', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Chhota Udaipur', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Dahod', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Dang (Ahwa)', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Devbhumi Dwarka', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Gandhinagar', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Gir Somnath', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Jamnagar', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Junagadh', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Kheda (Nadiad)', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Kutch (Bhuj)', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Mahisagar', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Mehsana', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Morbi', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Narmada (Rajpipla)', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Navsari', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Panchmahal (Godhra)', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Patan', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Porbandar', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Rajkot', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Sabarkantha (Himmatnagar)', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Surat', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Surendranagar', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Tapi (Vyara)', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Vadodara', (SELECT id FROM public.states WHERE name = 'Gujarat')),
('Valsad', (SELECT id FROM public.states WHERE name = 'Gujarat'));

-- Enable insert policy for districts so users can add new districts
CREATE POLICY "Authenticated users can insert districts" 
ON public.districts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);