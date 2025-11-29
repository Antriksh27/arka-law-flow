-- Create acts_master table for storing predefined acts
CREATE TABLE IF NOT EXISTS public.acts_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  act_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.acts_master ENABLE ROW LEVEL SECURITY;

-- Create policies for acts_master
CREATE POLICY "Anyone can view acts"
  ON public.acts_master
  FOR SELECT
  USING (true);

CREATE POLICY "Authorized users can insert acts"
  ON public.acts_master
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

CREATE POLICY "Authorized users can update acts"
  ON public.acts_master
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'lawyer', 'office_staff')
    )
  );

-- Insert some common Indian acts
INSERT INTO public.acts_master (act_name) VALUES
  ('Indian Penal Code, 1860'),
  ('Code of Criminal Procedure, 1973'),
  ('Code of Civil Procedure, 1908'),
  ('Indian Evidence Act, 1872'),
  ('Constitution of India, 1950'),
  ('Companies Act, 2013'),
  ('Income Tax Act, 1961'),
  ('Goods and Services Tax Act, 2017'),
  ('Consumer Protection Act, 2019'),
  ('Arbitration and Conciliation Act, 1996'),
  ('Negotiable Instruments Act, 1881'),
  ('Transfer of Property Act, 1882'),
  ('Indian Contract Act, 1872'),
  ('Limitation Act, 1963'),
  ('Motor Vehicles Act, 1988'),
  ('Hindu Marriage Act, 1955'),
  ('Hindu Succession Act, 1956'),
  ('Protection of Women from Domestic Violence Act, 2005'),
  ('Information Technology Act, 2000'),
  ('Prevention of Corruption Act, 1988')
ON CONFLICT (act_name) DO NOTHING;