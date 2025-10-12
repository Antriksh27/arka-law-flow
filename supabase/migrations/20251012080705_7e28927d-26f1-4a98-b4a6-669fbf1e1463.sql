-- Create table to store Zoho OAuth tokens
CREATE TABLE IF NOT EXISTS public.zoho_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(firm_id)
);

-- Enable RLS
ALTER TABLE public.zoho_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Firm members can view their firm's Zoho tokens
CREATE POLICY "Firm members can view Zoho tokens"
  ON public.zoho_tokens
  FOR SELECT
  USING (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
    )
  );

-- Policy: Admins can insert Zoho tokens
CREATE POLICY "Admins can insert Zoho tokens"
  ON public.zoho_tokens
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer')
    )
  );

-- Policy: Admins can update Zoho tokens
CREATE POLICY "Admins can update Zoho tokens"
  ON public.zoho_tokens
  FOR UPDATE
  USING (
    firm_id IN (
      SELECT tm.firm_id FROM public.team_members tm 
      WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'lawyer')
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_zoho_tokens_updated_at
  BEFORE UPDATE ON public.zoho_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();