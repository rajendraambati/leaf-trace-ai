-- Drop existing policy and create separate policies for better control
DROP POLICY IF EXISTS "Authorized users can manage shipments" ON public.shipments;

-- Allow authenticated users to create shipments (INSERT)
CREATE POLICY "Authenticated users can create shipments" 
ON public.shipments 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow authorized users to view all shipments (SELECT)
CREATE POLICY "Users can view all shipments" 
ON public.shipments 
FOR SELECT 
TO authenticated
USING (true);

-- Allow authorized users to update/delete shipments (UPDATE/DELETE)
CREATE POLICY "Authorized users can modify shipments" 
ON public.shipments 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'logistics_manager'::app_role) OR 
  has_role(auth.uid(), 'procurement_agent'::app_role) OR 
  has_role(auth.uid(), 'technician'::app_role) OR 
  has_role(auth.uid(), 'auditor'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authorized users can delete shipments" 
ON public.shipments 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'logistics_manager'::app_role) OR 
  has_role(auth.uid(), 'auditor'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create a function to automatically update batch status when shipment is created
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

-- Create trigger to auto-update batch status
DROP TRIGGER IF EXISTS on_shipment_create ON public.shipments;
CREATE TRIGGER on_shipment_create
  AFTER INSERT ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_batch_on_shipment_create();

-- Create function to update batch status when shipment is delivered
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

-- Create trigger to auto-update batch on delivery
DROP TRIGGER IF EXISTS on_shipment_delivered ON public.shipments;
CREATE TRIGGER on_shipment_delivered
  AFTER UPDATE ON public.shipments
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered')
  EXECUTE FUNCTION public.update_batch_on_shipment_delivered();