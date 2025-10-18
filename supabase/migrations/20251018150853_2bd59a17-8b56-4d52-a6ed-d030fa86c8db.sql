-- Add to_processing_unit_id to shipments table for warehouse-to-processing-unit shipments
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS to_processing_unit_id TEXT REFERENCES public.processing_units(id);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_shipments_to_processing_unit 
ON public.shipments(to_processing_unit_id) 
WHERE to_processing_unit_id IS NOT NULL;