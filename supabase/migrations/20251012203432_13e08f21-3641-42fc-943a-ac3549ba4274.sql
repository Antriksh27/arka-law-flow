-- Add is_main column to case_contacts table
ALTER TABLE public.case_contacts 
ADD COLUMN is_main boolean DEFAULT false;

-- Create index for faster lookups
CREATE INDEX idx_case_contacts_is_main ON public.case_contacts(case_id, is_main) WHERE is_main = true;

-- Function to ensure only one main contact per case
CREATE OR REPLACE FUNCTION public.ensure_single_main_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If setting this contact as main, unset all others for this case
  IF NEW.is_main = true THEN
    UPDATE public.case_contacts
    SET is_main = false
    WHERE case_id = NEW.case_id
      AND id != NEW.id
      AND is_main = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce single main contact
DROP TRIGGER IF EXISTS ensure_single_main_contact_trigger ON public.case_contacts;
CREATE TRIGGER ensure_single_main_contact_trigger
  BEFORE INSERT OR UPDATE ON public.case_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_main_contact();