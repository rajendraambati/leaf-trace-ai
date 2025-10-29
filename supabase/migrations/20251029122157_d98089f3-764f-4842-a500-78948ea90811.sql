-- Fix function search path security issue
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers with the fixed function
CREATE TRIGGER update_sales_representatives_updated_at 
  BEFORE UPDATE ON public.sales_representatives 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retailers_updated_at 
  BEFORE UPDATE ON public.retailers 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retailer_orders_updated_at 
  BEFORE UPDATE ON public.retailer_orders 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotional_campaigns_updated_at 
  BEFORE UPDATE ON public.promotional_campaigns 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();