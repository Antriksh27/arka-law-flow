-- Create instruction replies table for communication between lawyers and staff
CREATE TABLE public.instruction_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instruction_id UUID NOT NULL REFERENCES public.instructions(id) ON DELETE CASCADE,
  reply_message TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_from_lawyer BOOLEAN NOT NULL DEFAULT false,
  tagged_user_id UUID,
  is_status_update BOOLEAN NOT NULL DEFAULT false,
  old_status TEXT,
  new_status TEXT
);

-- Enable RLS
ALTER TABLE public.instruction_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for instruction replies
CREATE POLICY "Staff and lawyers can view replies for their instructions" 
ON public.instruction_replies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.instructions i 
    WHERE i.id = instruction_replies.instruction_id 
    AND (i.staff_id = auth.uid() OR i.lawyer_id = auth.uid())
  )
);

CREATE POLICY "Staff and lawyers can create replies" 
ON public.instruction_replies 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.instructions i 
    WHERE i.id = instruction_replies.instruction_id 
    AND (i.staff_id = auth.uid() OR i.lawyer_id = auth.uid())
  )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_instruction_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to instruction_replies
ALTER TABLE public.instruction_replies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

CREATE TRIGGER update_instruction_replies_updated_at
  BEFORE UPDATE ON public.instruction_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_instruction_replies_updated_at();