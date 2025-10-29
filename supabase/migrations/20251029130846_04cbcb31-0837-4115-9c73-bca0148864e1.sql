-- Create anomaly_logs table for tracking detected anomalies
CREATE TABLE IF NOT EXISTS public.anomaly_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  detected_by TEXT DEFAULT 'system',
  status TEXT NOT NULL DEFAULT 'open',
  resolution_suggested TEXT,
  resolution_applied TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  escalated BOOLEAN DEFAULT false,
  escalated_to UUID REFERENCES auth.users(id),
  escalated_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  root_cause TEXT,
  impact_assessment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anomaly_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view anomaly logs"
ON public.anomaly_logs
FOR SELECT
USING (true);

CREATE POLICY "System can insert anomaly logs"
ON public.anomaly_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authorized users can update anomaly logs"
ON public.anomaly_logs
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role) OR 
  has_role(auth.uid(), 'logistics_manager'::app_role) OR
  has_role(auth.uid(), 'factory_manager'::app_role)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_anomaly_logs_status ON public.anomaly_logs(status);
CREATE INDEX IF NOT EXISTS idx_anomaly_logs_severity ON public.anomaly_logs(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_logs_type ON public.anomaly_logs(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_logs_entity ON public.anomaly_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_logs_detected_at ON public.anomaly_logs(detected_at DESC);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_anomaly_logs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_anomaly_logs_updated_at
BEFORE UPDATE ON public.anomaly_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_anomaly_logs_updated_at();