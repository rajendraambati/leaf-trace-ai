-- Create table for ERP procurement orders
CREATE TABLE IF NOT EXISTS public.erp_procurement_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL,
  quantity_kg NUMERIC NOT NULL CHECK (quantity_kg > 0),
  delivery_date DATE NOT NULL,
  processing_unit_id TEXT REFERENCES public.processing_units(id),
  source_system TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
  validation_errors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.erp_procurement_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Factory managers can view ERP orders"
  ON public.erp_procurement_orders FOR SELECT
  USING (has_role(auth.uid(), 'factory_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Factory managers can update ERP orders"
  ON public.erp_procurement_orders FOR UPDATE
  USING (has_role(auth.uid(), 'factory_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage ERP orders"
  ON public.erp_procurement_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_erp_procurement_orders_updated_at
  BEFORE UPDATE ON public.erp_procurement_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create warehouse notifications table
CREATE TABLE IF NOT EXISTS public.warehouse_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id TEXT REFERENCES public.warehouses(id),
  order_id UUID REFERENCES public.erp_procurement_orders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warehouse_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Factory managers can view notifications"
  ON public.warehouse_notifications FOR SELECT
  USING (has_role(auth.uid(), 'factory_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Factory managers can update notifications"
  ON public.warehouse_notifications FOR UPDATE
  USING (has_role(auth.uid(), 'factory_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_erp_orders_po_number ON public.erp_procurement_orders(po_number);
CREATE INDEX idx_erp_orders_status ON public.erp_procurement_orders(status);
CREATE INDEX idx_warehouse_notifications_warehouse ON public.warehouse_notifications(warehouse_id);
CREATE INDEX idx_warehouse_notifications_read ON public.warehouse_notifications(is_read);