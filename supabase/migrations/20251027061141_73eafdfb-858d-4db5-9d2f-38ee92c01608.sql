-- Create function to send ERP delivery callback when shipment is delivered
CREATE OR REPLACE FUNCTION public.send_erp_delivery_callback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when shipment status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Log the delivery for ERP callback processing
    INSERT INTO public.audit_logs (
      action,
      resource,
      resource_id,
      data_snapshot
    ) VALUES (
      'DELIVERY_COMPLETED',
      'shipments',
      NEW.id,
      jsonb_build_object(
        'shipment_id', NEW.id,
        'batch_id', NEW.batch_id,
        'delivery_date', NEW.actual_arrival,
        'to_processing_unit_id', NEW.to_processing_unit_id,
        'status', 'delivered'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for delivery callback
DROP TRIGGER IF EXISTS trigger_send_erp_delivery_callback ON public.shipments;
CREATE TRIGGER trigger_send_erp_delivery_callback
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.send_erp_delivery_callback();