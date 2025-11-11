-- Update existing case_hearings to set firm_id from their associated case
UPDATE public.case_hearings ch
SET firm_id = c.firm_id
FROM public.cases c
WHERE ch.case_id = c.id
  AND ch.firm_id IS NULL;

-- Now make firm_id NOT NULL to prevent this issue in the future
ALTER TABLE public.case_hearings 
ALTER COLUMN firm_id SET NOT NULL;

-- Create a trigger to ensure firm_id matches the case's firm_id on insert/update
CREATE OR REPLACE FUNCTION public.validate_case_hearing_firm_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  case_firm_id uuid;
BEGIN
  -- Get the firm_id from the case
  SELECT firm_id INTO case_firm_id
  FROM public.cases
  WHERE id = NEW.case_id;
  
  -- If firm_id doesn't match, raise an error
  IF case_firm_id IS NOT NULL AND NEW.firm_id != case_firm_id THEN
    RAISE EXCEPTION 'Hearing firm_id must match the case firm_id';
  END IF;
  
  -- Auto-set firm_id if not provided
  IF NEW.firm_id IS NULL THEN
    NEW.firm_id := case_firm_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_case_hearing_firm_id_trigger
  BEFORE INSERT OR UPDATE ON public.case_hearings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_case_hearing_firm_id();
