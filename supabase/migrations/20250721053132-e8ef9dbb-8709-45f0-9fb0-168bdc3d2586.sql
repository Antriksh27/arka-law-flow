-- Drop the existing restrictive policy for case_activities INSERT
DROP POLICY IF EXISTS "Users can insert activities for cases they have access to" ON public.case_activities;

-- Create a more permissive policy that allows:
-- 1. Users to insert activities for cases they have access to
-- 2. Users to insert activities when uploading client documents (even without case association)
-- 3. System functions to insert activities (for triggers)
CREATE POLICY "Users can insert case activities" 
ON public.case_activities 
FOR INSERT 
WITH CHECK (
  -- Allow if user has access to the case
  (case_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM cases 
    WHERE cases.id = case_activities.case_id 
    AND (cases.created_by = auth.uid() OR cases.assigned_to = auth.uid() OR auth.uid() = ANY(cases.assigned_users))
  ))
  OR
  -- Allow if it's a client document activity (case_id is NULL) and user is authenticated
  (case_id IS NULL AND auth.uid() IS NOT NULL)
  OR
  -- Allow if the user is creating the activity themselves
  (created_by = auth.uid())
);

-- Also create a trigger to automatically log document activities
CREATE OR REPLACE FUNCTION public.log_document_activity_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only log if case_id is not null (case-associated documents)
    IF NEW.case_id IS NOT NULL THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        NEW.case_id,
        'document_uploaded',
        'Document "' || NEW.file_name || '" was uploaded',
        COALESCE(NEW.uploaded_by_user_id, NEW.uploaded_by, auth.uid()),
        jsonb_build_object(
          'document_id', NEW.id,
          'file_name', NEW.file_name,
          'file_type', NEW.file_type,
          'file_size', NEW.file_size
        )
      );
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Only log if case_id is not null
    IF OLD.case_id IS NOT NULL THEN
      INSERT INTO case_activities (
        case_id,
        activity_type,
        description,
        created_by,
        metadata
      ) VALUES (
        OLD.case_id,
        'document_deleted',
        'Document "' || OLD.file_name || '" was deleted',
        auth.uid(),
        jsonb_build_object(
          'document_id', OLD.id,
          'file_name', OLD.file_name,
          'file_type', OLD.file_type
        )
      );
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for document activities
DROP TRIGGER IF EXISTS document_activity_trigger ON public.documents;
CREATE TRIGGER document_activity_trigger
  AFTER INSERT OR DELETE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_document_activity_trigger();