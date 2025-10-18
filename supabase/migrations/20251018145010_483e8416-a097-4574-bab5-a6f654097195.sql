-- Add updated_at column to warehouses table
ALTER TABLE public.warehouses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to auto-update updated_at on warehouses
DROP TRIGGER IF EXISTS update_warehouses_updated_at ON public.warehouses;

CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();