-- Fix search_path for the trigger functions to resolve security warning
CREATE OR REPLACE FUNCTION public.update_batch_on_shipment_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update procurement batch status to 'in_transit'
  UPDATE public.procurement_batches
  SET 
    status = 'in_transit',
    updated_at = now()
  WHERE id = NEW.batch_id
    AND status IN ('pending', 'approved');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_batch_on_shipment_delivered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If shipment status changed to 'delivered', update batch
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE public.procurement_batches
    SET 
      status = 'delivered',
      updated_at = now()
    WHERE id = NEW.batch_id;
  END IF;
  
  RETURN NEW;
END;
$$;