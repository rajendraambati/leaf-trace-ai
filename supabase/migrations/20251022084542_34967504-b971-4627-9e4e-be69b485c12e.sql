-- Create function to handle shipment delivery to processing unit
CREATE OR REPLACE FUNCTION public.create_processing_batch_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _batch_quantity NUMERIC;
BEGIN
  -- Only process when shipment status changes to 'delivered' and has a destination processing unit
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.to_processing_unit_id IS NOT NULL THEN
    
    -- Get the batch quantity
    SELECT quantity_kg INTO _batch_quantity
    FROM public.procurement_batches
    WHERE id = NEW.batch_id;
    
    IF _batch_quantity IS NOT NULL THEN
      -- Check if processing batch already exists for this batch_id and unit_id
      IF NOT EXISTS (
        SELECT 1 FROM public.processing_batches 
        WHERE batch_id = NEW.batch_id AND unit_id = NEW.to_processing_unit_id
      ) THEN
        -- Create processing batch entry
        INSERT INTO public.processing_batches (
          unit_id,
          batch_id,
          input_quantity_kg,
          progress,
          start_time
        ) VALUES (
          NEW.to_processing_unit_id,
          NEW.batch_id,
          _batch_quantity,
          0,
          NEW.actual_arrival
        );
        
        -- Update processing unit status to processing
        UPDATE public.processing_units
        SET 
          status = 'processing',
          updated_at = now()
        WHERE id = NEW.to_processing_unit_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_create_processing_batch_on_delivery ON public.shipments;

-- Create trigger for shipment delivery to processing unit
CREATE TRIGGER trigger_create_processing_batch_on_delivery
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_processing_batch_on_delivery();

-- Add comment
COMMENT ON FUNCTION public.create_processing_batch_on_delivery() IS 'Automatically creates processing batch entries when shipments are delivered to processing units';