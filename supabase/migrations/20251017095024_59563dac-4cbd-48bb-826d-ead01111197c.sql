-- Update procurement_batches status constraint to include in-transit and delivered
ALTER TABLE public.procurement_batches 
DROP CONSTRAINT IF EXISTS procurement_batches_status_check;

ALTER TABLE public.procurement_batches
ADD CONSTRAINT procurement_batches_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'processing'::text, 'in-transit'::text, 'delivered'::text]));

-- Update trigger to use correct status for shipment creation
CREATE OR REPLACE FUNCTION public.update_batch_on_shipment_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update procurement batch status to 'in-transit'
  UPDATE public.procurement_batches
  SET 
    status = 'in-transit',
    updated_at = now()
  WHERE id = NEW.batch_id
    AND status IN ('pending', 'approved');
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_shipment_create ON public.shipments;
CREATE TRIGGER on_shipment_create
  AFTER INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_batch_on_shipment_create();

-- Ensure delivery trigger exists
DROP TRIGGER IF EXISTS on_shipment_delivered ON public.shipments;
CREATE TRIGGER on_shipment_delivered
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_batch_on_shipment_delivered();