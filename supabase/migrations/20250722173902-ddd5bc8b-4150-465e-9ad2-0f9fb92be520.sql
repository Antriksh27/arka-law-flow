-- Function to update client status to 'active' when office staff makes changes
CREATE OR REPLACE FUNCTION public.update_client_status_to_active()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the user making the change
  SELECT role INTO user_role
  FROM public.team_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- If the client status is 'new' and the user is office_staff, receptionist, admin, or lawyer
  -- and certain conditions are met, change status to 'active'
  IF OLD.status = 'new' AND user_role IN ('office_staff', 'receptionist', 'admin', 'lawyer') THEN
    -- Check if any significant changes were made (not just updated_at or created_at)
    IF (OLD.assigned_lawyer_id IS DISTINCT FROM NEW.assigned_lawyer_id) OR
       (OLD.address IS DISTINCT FROM NEW.address AND NEW.address IS NOT NULL AND NEW.address != '') OR
       (OLD.organization IS DISTINCT FROM NEW.organization AND NEW.organization IS NOT NULL AND NEW.organization != '') OR
       (OLD.notes IS DISTINCT FROM NEW.notes AND NEW.notes IS NOT NULL AND NEW.notes != '') THEN
      NEW.status := 'active';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for clients table
CREATE OR REPLACE TRIGGER trigger_update_client_status_to_active
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_status_to_active();

-- Function to update client status when documents are uploaded for them
CREATE OR REPLACE FUNCTION public.update_client_status_on_document_upload()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the user uploading the document
  SELECT role INTO user_role
  FROM public.team_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- If a document is uploaded for a client by office staff and client status is 'new'
  IF NEW.client_id IS NOT NULL AND user_role IN ('office_staff', 'receptionist', 'admin', 'lawyer') THEN
    UPDATE public.clients 
    SET status = 'active'
    WHERE id = NEW.client_id AND status = 'new';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for documents table
CREATE OR REPLACE TRIGGER trigger_update_client_status_on_document_upload
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_status_on_document_upload();

-- Function to update client status when cases are created for them
CREATE OR REPLACE FUNCTION public.update_client_status_on_case_creation()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role of the user creating the case
  SELECT role INTO user_role
  FROM public.team_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- If a case is created for a client by office staff and client status is 'new'
  IF NEW.client_id IS NOT NULL AND user_role IN ('office_staff', 'receptionist', 'admin', 'lawyer') THEN
    UPDATE public.clients 
    SET status = 'active'
    WHERE id = NEW.client_id AND status = 'new';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for cases table
CREATE OR REPLACE TRIGGER trigger_update_client_status_on_case_creation
  AFTER INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_status_on_case_creation();