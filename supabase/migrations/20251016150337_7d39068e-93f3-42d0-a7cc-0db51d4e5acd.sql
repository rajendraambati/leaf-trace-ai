-- Create IoT devices table
CREATE TABLE IF NOT EXISTS public.iot_devices (
  id TEXT PRIMARY KEY,
  device_type TEXT NOT NULL CHECK (device_type IN ('gps_tracker', 'qr_scanner', 'vehicle_sensor', 'temperature_sensor')),
  shipment_id TEXT REFERENCES public.shipments(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  battery_level NUMERIC,
  signal_strength NUMERIC,
  last_ping TIMESTAMP WITH TIME ZONE,
  firmware_version TEXT,
  location TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create IoT events table
CREATE TABLE IF NOT EXISTS public.iot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES public.iot_devices(id),
  shipment_id TEXT REFERENCES public.shipments(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('departure', 'checkpoint', 'arrival', 'inspection', 'temperature_alert', 'gps_update', 'qr_scan', 'sensor_reading')),
  event_data JSONB NOT NULL,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  temperature NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for iot_devices
CREATE POLICY "Everyone can view IoT devices"
  ON public.iot_devices FOR SELECT
  USING (true);

CREATE POLICY "Logistics managers can manage IoT devices"
  ON public.iot_devices FOR ALL
  USING (
    has_role(auth.uid(), 'logistics_manager'::app_role) OR 
    has_role(auth.uid(), 'auditor'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for iot_events
CREATE POLICY "Everyone can view IoT events"
  ON public.iot_events FOR SELECT
  USING (true);

CREATE POLICY "System can insert IoT events"
  ON public.iot_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Auditors can manage IoT events"
  ON public.iot_events FOR ALL
  USING (has_role(auth.uid(), 'auditor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_iot_devices_shipment ON public.iot_devices(shipment_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON public.iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_iot_events_device ON public.iot_events(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_events_shipment ON public.iot_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_iot_events_type ON public.iot_events(event_type);
CREATE INDEX IF NOT EXISTS idx_iot_events_timestamp ON public.iot_events(timestamp DESC);

-- Enable realtime for IoT tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_events;

-- Create function to update device last ping
CREATE OR REPLACE FUNCTION public.update_device_ping()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.iot_devices
  SET last_ping = NOW(), updated_at = NOW()
  WHERE id = NEW.device_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update device ping on event
CREATE TRIGGER trigger_update_device_ping
  AFTER INSERT ON public.iot_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_device_ping();