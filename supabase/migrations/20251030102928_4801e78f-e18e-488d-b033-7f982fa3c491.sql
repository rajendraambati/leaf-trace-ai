-- Create anomaly_logs table with comprehensive fields
CREATE TABLE IF NOT EXISTS public.anomaly_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'missing_serial', 'delayed_shipment', 'erp_sync_failure', 
    'compliance_sync_failure', 'overdue_maintenance', 'route_deviation',
    'temperature_alert', 'unauthorized_stop', 'missed_checkpoint'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated', 'investigating')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT NOT NULL,
  suggested_resolution TEXT,
  ai_root_cause TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  affected_resource_type TEXT,
  affected_resource_id TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalated_to UUID REFERENCES auth.users(id),
  escalation_reason TEXT,
  auto_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create anomaly_resolution_history for audit trail
CREATE TABLE IF NOT EXISTS public.anomaly_resolution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_id UUID NOT NULL REFERENCES public.anomaly_logs(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('detected', 'investigating', 'resolved', 'escalated', 'auto_resolved', 'reopened')),
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create anomaly_auto_resolutions for tracking automated fixes
CREATE TABLE IF NOT EXISTS public.anomaly_auto_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_id UUID NOT NULL REFERENCES public.anomaly_logs(id) ON DELETE CASCADE,
  resolution_type TEXT NOT NULL,
  resolution_action TEXT NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.anomaly_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_resolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_auto_resolutions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anomaly_logs
CREATE POLICY "Users can view anomaly logs" ON public.anomaly_logs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert anomaly logs" ON public.anomaly_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update anomaly logs" ON public.anomaly_logs
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for anomaly_resolution_history
CREATE POLICY "Users can view resolution history" ON public.anomaly_resolution_history
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert resolution history" ON public.anomaly_resolution_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for anomaly_auto_resolutions
CREATE POLICY "Users can view auto resolutions" ON public.anomaly_auto_resolutions
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage auto resolutions" ON public.anomaly_auto_resolutions
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_anomaly_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_anomaly_logs_updated_at_trigger
  BEFORE UPDATE ON public.anomaly_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_anomaly_logs_updated_at();

-- Trigger to log resolution history automatically
CREATE OR REPLACE FUNCTION log_anomaly_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.anomaly_resolution_history (anomaly_id, action, notes)
    VALUES (NEW.id, 'detected', 'Anomaly detected by system');
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO public.anomaly_resolution_history (
      anomaly_id, 
      action, 
      performed_by, 
      notes
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.status = 'resolved' THEN 
          CASE WHEN NEW.auto_resolved THEN 'auto_resolved' ELSE 'resolved' END
        WHEN NEW.status = 'escalated' THEN 'escalated'
        WHEN NEW.status = 'investigating' THEN 'investigating'
        ELSE 'reopened'
      END,
      NEW.resolved_by,
      CASE 
        WHEN NEW.status = 'resolved' THEN NEW.resolution_notes
        WHEN NEW.status = 'escalated' THEN NEW.escalation_reason
        ELSE NULL
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_anomaly_status_change_trigger
  AFTER INSERT OR UPDATE ON public.anomaly_logs
  FOR EACH ROW
  EXECUTE FUNCTION log_anomaly_status_change();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_anomaly_logs_status ON public.anomaly_logs(status);
CREATE INDEX IF NOT EXISTS idx_anomaly_logs_severity ON public.anomaly_logs(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_logs_type ON public.anomaly_logs(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_logs_detected_at ON public.anomaly_logs(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_resolution_history_anomaly_id ON public.anomaly_resolution_history(anomaly_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.anomaly_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anomaly_resolution_history;