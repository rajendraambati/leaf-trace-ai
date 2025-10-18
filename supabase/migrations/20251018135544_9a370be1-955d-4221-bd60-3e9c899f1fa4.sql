-- Add detailed address columns to warehouses table
ALTER TABLE public.warehouses 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add warehouse references to shipments table
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS from_warehouse_id TEXT REFERENCES public.warehouses(id),
ADD COLUMN IF NOT EXISTS to_warehouse_id TEXT REFERENCES public.warehouses(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_shipments_from_warehouse ON public.shipments(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_shipments_to_warehouse ON public.shipments(to_warehouse_id);