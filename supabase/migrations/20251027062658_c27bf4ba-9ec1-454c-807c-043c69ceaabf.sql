-- Create vehicles table for comprehensive tracking
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  registration_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  capacity_kg NUMERIC,
  driver_id UUID REFERENCES auth.users(id),
  driver_name TEXT,
  driver_phone TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in-transit', 'maintenance', 'offline')),
  current_location TEXT,
  current_latitude NUMERIC,
  current_longitude NUMERIC,
  fuel_level NUMERIC,
  battery_level NUMERIC,
  last_service_date DATE,
  next_service_due DATE,
  total_distance_km NUMERIC DEFAULT 0,
  health_score NUMERIC DEFAULT 100,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle tracking history table
CREATE TABLE IF NOT EXISTS public.vehicle_tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE CASCADE,
  shipment_id TEXT REFERENCES public.shipments(id),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  speed_kmh NUMERIC,
  heading NUMERIC,
  location_name TEXT,
  fuel_level NUMERIC,
  temperature NUMERIC,
  driver_status TEXT,
  ai_insights JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI vehicle insights table
CREATE TABLE IF NOT EXISTS public.ai_vehicle_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE CASCADE,
  shipment_id TEXT REFERENCES public.shipments(id),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('route_optimization', 'driver_wellbeing', 'predictive_maintenance', 'eta_update', 'weather_alert', 'traffic_alert', 'fuel_alert', 'safety_alert')),
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recommendations TEXT[],
  confidence_score NUMERIC,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver wellbeing logs
CREATE TABLE IF NOT EXISTS public.driver_wellbeing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id),
  shipment_id TEXT REFERENCES public.shipments(id),
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
  fatigue_level INTEGER CHECK (fatigue_level BETWEEN 1 AND 5),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  driving_hours NUMERIC,
  break_duration_minutes INTEGER,
  concerns TEXT,
  ai_recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON public.vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_vehicle ON public.vehicle_tracking_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_shipment ON public.vehicle_tracking_history(shipment_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_recorded ON public.vehicle_tracking_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_vehicle ON public.ai_vehicle_insights(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON public.ai_vehicle_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_severity ON public.ai_vehicle_insights(severity);
CREATE INDEX IF NOT EXISTS idx_ai_insights_read ON public.ai_vehicle_insights(is_read);
CREATE INDEX IF NOT EXISTS idx_driver_wellbeing_vehicle ON public.driver_wellbeing_logs(vehicle_id);

-- Add RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_vehicle_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_wellbeing_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Vehicles public read" ON public.vehicles;
DROP POLICY IF EXISTS "Vehicles managers write" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers update own vehicle" ON public.vehicles;

-- Vehicles policies  
CREATE POLICY "Vehicles public read" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Vehicles managers write" ON public.vehicles FOR ALL 
  USING (has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Drivers update own vehicle" ON public.vehicles FOR UPDATE 
  USING (driver_id = auth.uid());

-- Tracking history policies
DROP POLICY IF EXISTS "Tracking public read" ON public.vehicle_tracking_history;
DROP POLICY IF EXISTS "Tracking system insert" ON public.vehicle_tracking_history;
DROP POLICY IF EXISTS "Tracking managers write" ON public.vehicle_tracking_history;

CREATE POLICY "Tracking public read" ON public.vehicle_tracking_history FOR SELECT USING (true);
CREATE POLICY "Tracking system insert" ON public.vehicle_tracking_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Tracking managers write" ON public.vehicle_tracking_history FOR ALL 
  USING (has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- AI insights policies
DROP POLICY IF EXISTS "Insights public read" ON public.ai_vehicle_insights;
DROP POLICY IF EXISTS "Insights system insert" ON public.ai_vehicle_insights;
DROP POLICY IF EXISTS "Insights managers update" ON public.ai_vehicle_insights;

CREATE POLICY "Insights public read" ON public.ai_vehicle_insights FOR SELECT USING (true);
CREATE POLICY "Insights system insert" ON public.ai_vehicle_insights FOR INSERT WITH CHECK (true);
CREATE POLICY "Insights managers update" ON public.ai_vehicle_insights FOR UPDATE 
  USING (has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Driver wellbeing policies
DROP POLICY IF EXISTS "Wellbeing driver read" ON public.driver_wellbeing_logs;
DROP POLICY IF EXISTS "Wellbeing driver insert" ON public.driver_wellbeing_logs;
DROP POLICY IF EXISTS "Wellbeing managers read" ON public.driver_wellbeing_logs;

CREATE POLICY "Wellbeing driver read" ON public.driver_wellbeing_logs FOR SELECT 
  USING (driver_id = auth.uid() OR has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Wellbeing driver insert" ON public.driver_wellbeing_logs FOR INSERT 
  WITH CHECK (driver_id = auth.uid());
CREATE POLICY "Wellbeing managers read" ON public.driver_wellbeing_logs FOR SELECT 
  USING (has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update vehicle updated_at
CREATE OR REPLACE FUNCTION update_vehicle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vehicle_timestamp ON public.vehicles;
CREATE TRIGGER trigger_update_vehicle_timestamp
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_updated_at();