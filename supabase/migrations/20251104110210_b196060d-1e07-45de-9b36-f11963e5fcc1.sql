-- Create farmer_biometrics table to store fingerprint and biometric data
CREATE TABLE IF NOT EXISTS public.farmer_biometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id TEXT NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  fingerprint_data JSONB NOT NULL,
  fingerprint_template TEXT,
  capture_device TEXT,
  capture_quality NUMERIC CHECK (capture_quality >= 0 AND capture_quality <= 100),
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.farmer_biometrics ENABLE ROW LEVEL SECURITY;

-- Create policies for farmer_biometrics
CREATE POLICY "Technicians and admins can manage biometrics"
  ON public.farmer_biometrics FOR ALL
  USING (
    has_role(auth.uid(), 'technician'::app_role) OR 
    has_role(auth.uid(), 'procurement_agent'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'auditor'::app_role)
  );

CREATE POLICY "Everyone can view biometrics"
  ON public.farmer_biometrics FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_farmer_biometrics_farmer_id ON public.farmer_biometrics(farmer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_farmer_biometrics_updated_at
  BEFORE UPDATE ON public.farmer_biometrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();