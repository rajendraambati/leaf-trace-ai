-- Create API keys table for client access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  allowed_endpoints TEXT[] NOT NULL DEFAULT ARRAY['*'],
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  is_sandbox BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0
);

-- Create API request logs table
CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_body JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Admins can manage API keys"
  ON public.api_keys
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'system_admin'::app_role)
  );

CREATE POLICY "Users can view their own API keys"
  ON public.api_keys
  FOR SELECT
  USING (created_by = auth.uid());

-- RLS Policies for api_request_logs
CREATE POLICY "Admins can view all API logs"
  ON public.api_request_logs
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'system_admin'::app_role)
  );

CREATE POLICY "Users can view logs for their API keys"
  ON public.api_request_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.api_keys
      WHERE api_keys.id = api_request_logs.api_key_id
      AND api_keys.created_by = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_api_keys_key ON public.api_keys(api_key);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active);
CREATE INDEX idx_api_request_logs_api_key ON public.api_request_logs(api_key_id);
CREATE INDEX idx_api_request_logs_created_at ON public.api_request_logs(created_at);

-- Function to update last_used_at
CREATE OR REPLACE FUNCTION update_api_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.api_keys
  SET last_used_at = now(),
      usage_count = usage_count + 1
  WHERE id = NEW.api_key_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update API key usage
CREATE TRIGGER update_api_key_usage_trigger
  AFTER INSERT ON public.api_request_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_api_key_usage();