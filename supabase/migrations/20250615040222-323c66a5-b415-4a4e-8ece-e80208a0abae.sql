
-- 1. Add status enum if not already present (will skip if exists)
DO $$ BEGIN
  CREATE TYPE team_member_status AS ENUM ('active', 'inactive', 'onboarding');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Update status column to new enum type, if needed
ALTER TABLE public.team_members
  ALTER COLUMN status TYPE team_member_status USING status::text::team_member_status;

-- 3. Add avatar_url and join_date columns if missing
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS join_date date;

-- For legacy, set join_date to joined_at where null
UPDATE public.team_members SET join_date = (joined_at::date) WHERE join_date IS NULL AND joined_at IS NOT NULL;

-- 4. Create the case_assignments table (many-to-many: member <-> case)
CREATE TABLE IF NOT EXISTS public.case_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.team_members(id),
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (team_member_id, case_id)
);

-- 5. Create team_member_notes table (admin notes per member)
CREATE TABLE IF NOT EXISTS public.team_member_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  note text,
  created_by uuid NOT NULL REFERENCES public.team_members(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 6. Row Level Security (RLS) — firm scoping and admin-only for notes

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_notes ENABLE ROW LEVEL SECURITY;

-- Only members of a firm can SELECT their firm's team_members
CREATE POLICY "Team: Firm only" ON public.team_members
  FOR SELECT USING (firm_id = (SELECT firm_id FROM public.team_members WHERE user_id = auth.uid()));

-- Only admin/lawyer can UPDATE team_members
CREATE POLICY "Team: Admin/Lawyer can update" ON public.team_members
  FOR UPDATE USING (
    firm_id = (SELECT firm_id FROM public.team_members WHERE user_id = auth.uid())
    AND role IN ('admin', 'lawyer')
  );

-- Only firm members can view case assignments
CREATE POLICY "CaseAssignments: Firm only" ON public.case_assignments
  FOR SELECT USING (
    team_member_id IN (
      SELECT id FROM public.team_members WHERE firm_id = (SELECT firm_id FROM public.team_members WHERE user_id = auth.uid())
    )
  );

-- Only assigned member or admins can update/delete assignments
CREATE POLICY "CaseAssignments: Self or Admin" ON public.case_assignments
  FOR UPDATE USING (
    team_member_id = (SELECT id FROM public.team_members WHERE user_id = auth.uid())
    OR (SELECT role FROM public.team_members WHERE user_id = auth.uid()) = 'admin'
  );

-- Only admins can read/write notes
CREATE POLICY "Notes: Admin only" ON public.team_member_notes
  FOR ALL USING (
    (SELECT role FROM public.team_members WHERE user_id = auth.uid()) = 'admin'
  );
