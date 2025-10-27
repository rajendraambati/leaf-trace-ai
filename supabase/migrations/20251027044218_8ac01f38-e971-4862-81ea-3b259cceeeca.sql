-- Add warehouse validation fields to erp_procurement_orders
ALTER TABLE public.erp_procurement_orders
ADD COLUMN IF NOT EXISTS warehouse_id TEXT REFERENCES public.warehouses(id),
ADD COLUMN IF NOT EXISTS inventory_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS inventory_check_notes TEXT,
ADD COLUMN IF NOT EXISTS quantity_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmed_quantity_kg NUMERIC,
ADD COLUMN IF NOT EXISTS dispatch_scheduled_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'accepted', 'rejected', 'dispatched')),
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create warehouse_dispatch_schedule table
CREATE TABLE IF NOT EXISTS public.warehouse_dispatch_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  erp_order_id UUID REFERENCES public.erp_procurement_orders(id) ON DELETE CASCADE NOT NULL,
  warehouse_id TEXT REFERENCES public.warehouses(id) NOT NULL,
  batch_id TEXT REFERENCES public.procurement_batches(id),
  scheduled_dispatch_date TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_dispatch_date TIMESTAMP WITH TIME ZONE,
  vehicle_id TEXT,
  driver_name TEXT,
  dispatch_status TEXT DEFAULT 'scheduled' CHECK (dispatch_status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  dispatch_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on warehouse_dispatch_schedule
ALTER TABLE public.warehouse_dispatch_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for warehouse_dispatch_schedule
CREATE POLICY "Factory and logistics managers can view dispatch schedules"
  ON public.warehouse_dispatch_schedule FOR SELECT
  USING (has_role(auth.uid(), 'factory_manager'::app_role) OR has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Factory and logistics managers can manage dispatch schedules"
  ON public.warehouse_dispatch_schedule FOR ALL
  USING (has_role(auth.uid(), 'factory_manager'::app_role) OR has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for warehouse_dispatch_schedule updated_at
CREATE TRIGGER update_warehouse_dispatch_schedule_updated_at
  BEFORE UPDATE ON public.warehouse_dispatch_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create shipment when dispatch is scheduled
CREATE OR REPLACE FUNCTION public.create_shipment_from_dispatch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _erp_order RECORD;
  _warehouse RECORD;
  _processing_unit RECORD;
BEGIN
  -- Only create shipment when dispatch status changes to 'in-progress'
  IF NEW.dispatch_status = 'in-progress' AND (OLD.dispatch_status IS NULL OR OLD.dispatch_status != 'in-progress') THEN
    
    -- Get ERP order details
    SELECT * INTO _erp_order FROM public.erp_procurement_orders WHERE id = NEW.erp_order_id;
    
    -- Get warehouse details
    SELECT * INTO _warehouse FROM public.warehouses WHERE id = NEW.warehouse_id;
    
    -- Get processing unit if specified
    IF _erp_order.processing_unit_id IS NOT NULL THEN
      SELECT * INTO _processing_unit FROM public.processing_units WHERE id = _erp_order.processing_unit_id;
    END IF;
    
    -- Create shipment if batch_id exists
    IF NEW.batch_id IS NOT NULL THEN
      INSERT INTO public.shipments (
        id,
        batch_id,
        from_location,
        from_warehouse_id,
        to_location,
        to_processing_unit_id,
        vehicle_id,
        driver_name,
        status,
        departure_time
      ) VALUES (
        'SHP-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(NEW.id::TEXT, 1, 8),
        NEW.batch_id,
        _warehouse.name || ', ' || _warehouse.location,
        NEW.warehouse_id,
        COALESCE(_processing_unit.name, _erp_order.processing_unit_id, 'Processing Unit'),
        _erp_order.processing_unit_id,
        NEW.vehicle_id,
        NEW.driver_name,
        'in-transit',
        NOW()
      );
      
      -- Update ERP order status
      UPDATE public.erp_procurement_orders
      SET validation_status = 'dispatched'
      WHERE id = NEW.erp_order_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating shipment
CREATE TRIGGER create_shipment_on_dispatch
  AFTER INSERT OR UPDATE ON public.warehouse_dispatch_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.create_shipment_from_dispatch();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_erp_orders_warehouse ON public.erp_procurement_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_erp_orders_validation_status ON public.erp_procurement_orders(validation_status);
CREATE INDEX IF NOT EXISTS idx_dispatch_schedule_warehouse ON public.warehouse_dispatch_schedule(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_schedule_status ON public.warehouse_dispatch_schedule(dispatch_status);