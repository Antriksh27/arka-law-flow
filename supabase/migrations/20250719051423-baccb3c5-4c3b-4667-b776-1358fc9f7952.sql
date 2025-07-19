-- Add DELETE policy for instructions table
CREATE POLICY "Lawyers can delete their own instructions" 
ON public.instructions 
FOR DELETE 
USING (lawyer_id = auth.uid());