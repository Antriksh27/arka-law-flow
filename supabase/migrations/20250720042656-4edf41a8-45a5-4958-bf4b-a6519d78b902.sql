-- Update RLS policies for cases table to allow office_staff to view and modify cases

-- Update the policy for inserting cases to include office_staff
DROP POLICY IF EXISTS "Admins and lawyers can insert cases" ON public.cases;
CREATE POLICY "Admins, lawyers and office staff can insert cases" 
ON public.cases 
FOR INSERT 
WITH CHECK (firm_id IN ( 
  SELECT law_firm_members.law_firm_id
  FROM law_firm_members
  WHERE ((law_firm_members.user_id = auth.uid()) AND (law_firm_members.role = ANY (ARRAY['admin'::text, 'lawyer'::text, 'partner'::text, 'associate'::text, 'office_staff'::text])))
));

-- Update the policy for updating cases to include office_staff
DROP POLICY IF EXISTS "Admins and lawyers can update cases" ON public.cases;
CREATE POLICY "Admins, lawyers and office staff can update cases" 
ON public.cases 
FOR UPDATE 
USING (firm_id IN ( 
  SELECT law_firm_members.law_firm_id
  FROM law_firm_members
  WHERE ((law_firm_members.user_id = auth.uid()) AND (law_firm_members.role = ANY (ARRAY['admin'::text, 'lawyer'::text, 'partner'::text, 'associate'::text, 'office_staff'::text])))
));

-- Update policies for other case-related tables to include office_staff

-- Update case_files policies
DROP POLICY IF EXISTS "Users can insert files for cases they have access to" ON public.case_files;
CREATE POLICY "Users can insert files for cases they have access to" 
ON public.case_files 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM cases
  JOIN law_firm_members lfm ON lfm.law_firm_id = cases.firm_id
  WHERE ((cases.id = case_files.case_id) AND (lfm.user_id = auth.uid()) AND (lfm.role = ANY (ARRAY['admin'::text, 'lawyer'::text, 'partner'::text, 'associate'::text, 'office_staff'::text])))
));

DROP POLICY IF EXISTS "Users can view files for cases they have access to" ON public.case_files;
CREATE POLICY "Users can view files for cases they have access to" 
ON public.case_files 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM cases
  JOIN law_firm_members lfm ON lfm.law_firm_id = cases.firm_id
  WHERE ((cases.id = case_files.case_id) AND (lfm.user_id = auth.uid()) AND (lfm.role = ANY (ARRAY['admin'::text, 'lawyer'::text, 'partner'::text, 'associate'::text, 'office_staff'::text])))
));

-- Update case_emails policies
DROP POLICY IF EXISTS "Users can insert emails for cases they have access to" ON public.case_emails;
CREATE POLICY "Users can insert emails for cases they have access to" 
ON public.case_emails 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM cases
  JOIN law_firm_members lfm ON lfm.law_firm_id = cases.firm_id
  WHERE ((cases.id = case_emails.case_id) AND (lfm.user_id = auth.uid()) AND (lfm.role = ANY (ARRAY['admin'::text, 'lawyer'::text, 'partner'::text, 'associate'::text, 'office_staff'::text])))
));

DROP POLICY IF EXISTS "Users can view emails for cases they have access to" ON public.case_emails;
CREATE POLICY "Users can view emails for cases they have access to" 
ON public.case_emails 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM cases
  JOIN law_firm_members lfm ON lfm.law_firm_id = cases.firm_id
  WHERE ((cases.id = case_emails.case_id) AND (lfm.user_id = auth.uid()) AND (lfm.role = ANY (ARRAY['admin'::text, 'lawyer'::text, 'partner'::text, 'associate'::text, 'office_staff'::text])))
));

-- Update case_notes policies
DROP POLICY IF EXISTS "Users can insert notes for cases they have access to" ON public.case_notes;
CREATE POLICY "Users can insert notes for cases they have access to" 
ON public.case_notes 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM cases
  JOIN law_firm_members lfm ON lfm.law_firm_id = cases.firm_id
  WHERE ((cases.id = case_notes.case_id) AND (lfm.user_id = auth.uid()) AND (lfm.role = ANY (ARRAY['admin'::text, 'lawyer'::text, 'partner'::text, 'associate'::text, 'office_staff'::text])))
));

DROP POLICY IF EXISTS "Users can view notes for cases they have access to" ON public.case_notes;
CREATE POLICY "Users can view notes for cases they have access to" 
ON public.case_notes 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM cases
  JOIN law_firm_members lfm ON lfm.law_firm_id = cases.firm_id
  WHERE ((cases.id = case_notes.case_id) AND (lfm.user_id = auth.uid()) AND (lfm.role = ANY (ARRAY['admin'::text, 'lawyer'::text, 'partner'::text, 'associate'::text, 'office_staff'::text])))
));