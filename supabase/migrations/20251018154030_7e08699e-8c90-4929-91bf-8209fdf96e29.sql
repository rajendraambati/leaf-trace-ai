-- Create function to update warehouse stock when outgoing shipment changes status
CREATE OR REPLACE FUNCTION public.update_warehouse_stock_on_outgoing_shipment()
RETURNS TRIGGER AS $$
DECLARE
  _batch_quantity NUMERIC;
BEGIN
  -- Only process shipments FROM warehouse TO processing unit
  IF NEW.from_warehouse_id IS NOT NULL AND NEW.to_processing_unit_id IS NOT NULL THEN
    
    -- When shipment status changes to 'in-transit', reduce warehouse stock
    IF NEW.status = 'in-transit' AND (OLD.status IS NULL OR OLD.status != 'in-transit') THEN
      
      -- Get the batch quantity
      SELECT quantity_kg INTO _batch_quantity
      FROM public.procurement_batches
      WHERE id = NEW.batch_id;
      
      IF _batch_quantity IS NOT NULL THEN
        -- Update warehouse stock (reduce)
        UPDATE public.warehouses
        SET 
          current_stock_kg = GREATEST(COALESCE(current_stock_kg, 0) - _batch_quantity, 0),
          updated_at = now()
        WHERE id = NEW.from_warehouse_id;
        
        -- Mark warehouse inventory as exited
        UPDATE public.warehouse_inventory
        SET exit_date = now()
        WHERE warehouse_id = NEW.from_warehouse_id
          AND batch_id = NEW.batch_id
          AND exit_date IS NULL;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for outgoing shipments from warehouse
DROP TRIGGER IF EXISTS warehouse_outgoing_shipment_trigger ON public.shipments;
CREATE TRIGGER warehouse_outgoing_shipment_trigger
AFTER INSERT OR UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_warehouse_stock_on_outgoing_shipment();

-- Modify existing processing trigger to prevent double stock reduction
CREATE OR REPLACE FUNCTION public.update_warehouse_stock_on_processing()
RETURNS TRIGGER AS $$
DECLARE
  _warehouse_id TEXT;
  _batch_quantity NUMERIC;
  _stock_already_reduced BOOLEAN;
BEGIN
  -- Find the warehouse that has this batch
  SELECT wi.warehouse_id, wi.quantity_kg INTO _warehouse_id, _batch_quantity
  FROM public.warehouse_inventory wi
  WHERE wi.batch_id = NEW.batch_id
    AND wi.exit_date IS NULL
  ORDER BY wi.entry_date DESC
  LIMIT 1;
  
  IF _warehouse_id IS NOT NULL THEN
    -- Check if stock was already reduced by a shipment
    SELECT EXISTS (
      SELECT 1 FROM public.shipments
      WHERE batch_id = NEW.batch_id
        AND from_warehouse_id = _warehouse_id
        AND status IN ('in-transit', 'delivered')
    ) INTO _stock_already_reduced;
    
    -- Only reduce stock if not already reduced by shipment
    IF NOT _stock_already_reduced THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;