-- Create legal_news table to store articles
CREATE TABLE IF NOT EXISTS public.legal_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.legal_news ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view legal news" 
ON public.legal_news 
FOR SELECT 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_legal_news_published_at ON public.legal_news(published_at DESC);
CREATE INDEX idx_legal_news_source ON public.legal_news(source);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_legal_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_legal_news_updated_at
BEFORE UPDATE ON public.legal_news
FOR EACH ROW
EXECUTE FUNCTION public.update_legal_news_updated_at();