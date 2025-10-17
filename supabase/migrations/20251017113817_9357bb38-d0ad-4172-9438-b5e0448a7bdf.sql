-- Add logistics enhancement columns to shipments table
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS route JSONB,
ADD COLUMN IF NOT EXISTS planned_route JSONB,
ADD COLUMN IF NOT EXISTS actual_route JSONB,
ADD COLUMN IF NOT EXISTS predictive_maintenance_alert JSONB,
ADD COLUMN IF NOT EXISTS route_optimization_data JSONB,
ADD COLUMN IF NOT EXISTS delivery_confirmation JSONB,
ADD COLUMN IF NOT EXISTS traffic_conditions TEXT,
ADD COLUMN IF NOT EXISTS weather_conditions TEXT,
ADD COLUMN IF NOT EXISTS estimated_delay_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS checkpoint_status JSONB;

-- Add comments for new columns
COMMENT ON COLUMN public.shipments.route IS 'Array of GeoJSON points representing the current route';
COMMENT ON COLUMN public.shipments.planned_route IS 'AI-optimized planned route with waypoints';
COMMENT ON COLUMN public.shipments.actual_route IS 'Actual route taken by vehicle with timestamps';
COMMENT ON COLUMN public.shipments.predictive_maintenance_alert IS 'ML-based maintenance alerts and predictions';
COMMENT ON COLUMN public.shipments.route_optimization_data IS 'ML model data for route optimization';
COMMENT ON COLUMN public.shipments.delivery_confirmation IS 'Mobile scan confirmation data with signature/photos';
COMMENT ON COLUMN public.shipments.checkpoint_status IS 'Status of scheduled checkpoints along route';

-- Create index for route queries
CREATE INDEX IF NOT EXISTS idx_shipments_route ON public.shipments USING GIN (route);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments (status);
CREATE INDEX IF NOT EXISTS idx_shipments_batch_id ON public.shipments (batch_id);

-- Create logistics_checkpoints table for tracking waypoints
CREATE TABLE IF NOT EXISTS public.logistics_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id TEXT NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL,
  checkpoint_type TEXT NOT NULL CHECK (checkpoint_type IN ('departure', 'waypoint', 'rest_stop', 'inspection', 'destination')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  actual_time TIMESTAMP WITH TIME ZONE,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reached', 'missed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for logistics_checkpoints
ALTER TABLE public.logistics_checkpoints ENABLE ROW LEVEL SECURITY;

-- RLS policies for logistics_checkpoints
CREATE POLICY "Everyone can view checkpoints"
  ON public.logistics_checkpoints
  FOR SELECT
  USING (true);

CREATE POLICY "Authorized users can manage checkpoints"
  ON public.logistics_checkpoints
  FOR ALL
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'auditor') OR 
    has_role(auth.uid(), 'admin')
  );

-- Create trigger for updating updated_at
CREATE TRIGGER update_logistics_checkpoints_updated_at
  BEFORE UPDATE ON public.logistics_checkpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create vehicle_maintenance table for predictive maintenance
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT NOT NULL,
  maintenance_type TEXT NOT NULL,
  predicted_date DATE,
  actual_date DATE,
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ai_confidence NUMERIC CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  status TEXT DEFAULT 'predicted' CHECK (status IN ('predicted', 'scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for vehicle_maintenance
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicle_maintenance
CREATE POLICY "Everyone can view maintenance"
  ON public.vehicle_maintenance
  FOR SELECT
  USING (true);

CREATE POLICY "Logistics managers can manage maintenance"
  ON public.vehicle_maintenance
  FOR ALL
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'auditor') OR 
    has_role(auth.uid(), 'admin')
  );

-- Create trigger for updating updated_at
CREATE TRIGGER update_vehicle_maintenance_updated_at
  BEFORE UPDATE ON public.vehicle_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();