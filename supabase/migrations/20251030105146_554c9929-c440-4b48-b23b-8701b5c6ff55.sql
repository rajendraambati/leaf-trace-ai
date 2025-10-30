-- Create table for secure BI report sharing
CREATE TABLE IF NOT EXISTS public.bi_report_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token TEXT NOT NULL UNIQUE,
  report_name TEXT NOT NULL,
  report_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bi_report_shares ENABLE ROW LEVEL SECURITY;

-- Policies for bi_report_shares
CREATE POLICY "Users can view their own shares"
  ON public.bi_report_shares
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create shares"
  ON public.bi_report_shares
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own shares"
  ON public.bi_report_shares
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Public can view active shares with valid token"
  ON public.bi_report_shares
  FOR SELECT
  USING (is_active = true AND expires_at > now());

-- Create trigger for updated_at
CREATE TRIGGER update_bi_report_shares_updated_at
  BEFORE UPDATE ON public.bi_report_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_bi_report_shares_token ON public.bi_report_shares(share_token);
CREATE INDEX idx_bi_report_shares_created_by ON public.bi_report_shares(created_by);
CREATE INDEX idx_bi_report_shares_expires_at ON public.bi_report_shares(expires_at);