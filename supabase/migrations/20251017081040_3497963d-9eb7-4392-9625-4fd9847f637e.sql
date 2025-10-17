-- Add missing fields to procurement_batches table for enhanced traceability
ALTER TABLE public.procurement_batches 
ADD COLUMN IF NOT EXISTS farmer_name TEXT,
ADD COLUMN IF NOT EXISTS moisture_percentage NUMERIC CHECK (moisture_percentage >= 0 AND moisture_percentage <= 100),
ADD COLUMN IF NOT EXISTS gps_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS gps_longitude NUMERIC;

-- Add comment for documentation
COMMENT ON COLUMN public.procurement_batches.farmer_name IS 'Cached farmer name for quick access without joins';
COMMENT ON COLUMN public.procurement_batches.moisture_percentage IS 'Moisture content percentage at procurement time';
COMMENT ON COLUMN public.procurement_batches.gps_latitude IS 'GPS latitude for batch location traceability';
COMMENT ON COLUMN public.procurement_batches.gps_longitude IS 'GPS longitude for batch location traceability';