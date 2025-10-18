-- Create function to update warehouse stock when shipment is delivered
CREATE OR REPLACE FUNCTION public.update_warehouse_stock_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _batch_quantity NUMERIC;
BEGIN
  -- Only process when shipment status changes to 'delivered' and has a destination warehouse
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.to_warehouse_id IS NOT NULL THEN
    -- Get the batch quantity
    SELECT quantity_kg INTO _batch_quantity
    FROM public.procurement_batches
    WHERE id = NEW.batch_id;
    
    IF _batch_quantity IS NOT NULL THEN
      -- Update warehouse stock
      UPDATE public.warehouses
      SET 
        current_stock_kg = COALESCE(current_stock_kg, 0) + _batch_quantity,
        updated_at = now()
      WHERE id = NEW.to_warehouse_id;
      
      -- Create warehouse inventory entry
      INSERT INTO public.warehouse_inventory (warehouse_id, batch_id, quantity_kg, entry_date)
      VALUES (NEW.to_warehouse_id, NEW.batch_id, _batch_quantity, NEW.actual_arrival);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for shipment delivery
DROP TRIGGER IF EXISTS trigger_update_warehouse_stock_on_delivery ON public.shipments;
CREATE TRIGGER trigger_update_warehouse_stock_on_delivery
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_warehouse_stock_on_delivery();

-- Create function to update warehouse stock when batch moves to processing
CREATE OR REPLACE FUNCTION public.update_warehouse_stock_on_processing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _warehouse_id TEXT;
  _batch_quantity NUMERIC;
BEGIN
  -- Find the warehouse that has this batch
  SELECT wi.warehouse_id, wi.quantity_kg INTO _warehouse_id, _batch_quantity
  FROM public.warehouse_inventory wi
  WHERE wi.batch_id = NEW.batch_id
    AND wi.exit_date IS NULL
  ORDER BY wi.entry_date DESC
  LIMIT 1;
  
  IF _warehouse_id IS NOT NULL THEN
    -- Update warehouse stock by reducing it
    UPDATE public.warehouses
    SET 
      current_stock_kg = GREATEST(COALESCE(current_stock_kg, 0) - NEW.input_quantity_kg, 0),
      updated_at = now()
    WHERE id = _warehouse_id;
    
    -- Mark inventory as exited
    UPDATE public.warehouse_inventory
    SET exit_date = now()
    WHERE warehouse_id = _warehouse_id
      AND batch_id = NEW.batch_id
      AND exit_date IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for processing batch creation
DROP TRIGGER IF EXISTS trigger_update_warehouse_stock_on_processing ON public.processing_batches;
CREATE TRIGGER trigger_update_warehouse_stock_on_processing
  AFTER INSERT ON public.processing_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_warehouse_stock_on_processing();