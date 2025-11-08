-- Create client_internal_notes table for office staff only notes
CREATE TABLE IF NOT EXISTS public.client_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_internal_notes ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has office_staff role
CREATE OR REPLACE FUNCTION public.is_office_staff(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND role = 'office_staff'
  )
$$;

-- RLS Policy: Only office_staff can view internal notes
CREATE POLICY "Office staff can view internal notes"
ON public.client_internal_notes
FOR SELECT
TO authenticated
USING (public.is_office_staff(auth.uid()));

-- RLS Policy: Only office_staff can insert internal notes
CREATE POLICY "Office staff can create internal notes"
ON public.client_internal_notes
FOR INSERT
TO authenticated
WITH CHECK (public.is_office_staff(auth.uid()));

-- RLS Policy: Only office_staff can update internal notes
CREATE POLICY "Office staff can update internal notes"
ON public.client_internal_notes
FOR UPDATE
TO authenticated
USING (public.is_office_staff(auth.uid()));

-- RLS Policy: Only office_staff can delete internal notes
CREATE POLICY "Office staff can delete internal notes"
ON public.client_internal_notes
FOR DELETE
TO authenticated
USING (public.is_office_staff(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_client_internal_notes_updated_at
BEFORE UPDATE ON public.client_internal_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_client_internal_notes_client_id ON public.client_internal_notes(client_id);
CREATE INDEX idx_client_internal_notes_created_by ON public.client_internal_notes(created_by);