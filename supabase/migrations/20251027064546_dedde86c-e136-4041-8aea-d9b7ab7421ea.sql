-- Add columns for driver performance and telemetry to vehicles table
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS driver_performance_score NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS on_time_deliveries INTEGER DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS average_speed_kmh NUMERIC;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS harsh_braking_incidents INTEGER DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS harsh_acceleration_incidents INTEGER DEFAULT 0;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS idle_time_minutes INTEGER DEFAULT 0;

-- Add AI prediction columns to shipments table
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS ai_predicted_eta TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS ai_eta_confidence NUMERIC;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS ai_anomaly_detected BOOLEAN DEFAULT false;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS ai_anomaly_severity TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS ai_anomaly_details JSONB;

-- Add telemetry columns to vehicle_tracking_history
ALTER TABLE public.vehicle_tracking_history ADD COLUMN IF NOT EXISTS acceleration NUMERIC;
ALTER TABLE public.vehicle_tracking_history ADD COLUMN IF NOT EXISTS braking_force NUMERIC;
ALTER TABLE public.vehicle_tracking_history ADD COLUMN IF NOT EXISTS engine_rpm NUMERIC;
ALTER TABLE public.vehicle_tracking_history ADD COLUMN IF NOT EXISTS is_idle BOOLEAN DEFAULT false;

-- Create index for faster historical queries
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_vehicle_time ON public.vehicle_tracking_history(vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_vehicle_status ON public.shipments(vehicle_id, status, departure_time);

-- Create trip statistics materialized view for faster AI analysis
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vehicle_trip_statistics AS
SELECT 
  v.id as vehicle_id,
  v.registration_number,
  COUNT(DISTINCT s.id) as total_trips,
  COUNT(DISTINCT CASE WHEN s.status = 'delivered' AND s.actual_arrival <= s.eta THEN s.id END) as on_time_trips,
  AVG(CASE WHEN s.status = 'delivered' THEN EXTRACT(EPOCH FROM (s.actual_arrival - s.departure_time))/3600 END) as avg_trip_duration_hours,
  AVG(vth.speed_kmh) as avg_speed,
  MAX(vth.speed_kmh) as max_speed,
  SUM(CASE WHEN vth.is_idle THEN 1 ELSE 0 END) as idle_count
FROM public.vehicles v
LEFT JOIN public.shipments s ON v.id = s.vehicle_id
LEFT JOIN public.vehicle_tracking_history vth ON v.id = vth.vehicle_id
GROUP BY v.id, v.registration_number;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_trip_stats_vehicle ON public.vehicle_trip_statistics(vehicle_id);

-- Function to refresh trip statistics (call this periodically)
CREATE OR REPLACE FUNCTION public.refresh_vehicle_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.vehicle_trip_statistics;
END;
$$;