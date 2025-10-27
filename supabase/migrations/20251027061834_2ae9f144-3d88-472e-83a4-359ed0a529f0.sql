-- Add indices for better filter performance on ERP orders
CREATE INDEX IF NOT EXISTS idx_erp_orders_processing_unit ON public.erp_procurement_orders(processing_unit_id);
CREATE INDEX IF NOT EXISTS idx_erp_orders_product_type ON public.erp_procurement_orders(product_type);
CREATE INDEX IF NOT EXISTS idx_erp_orders_delivery_date ON public.erp_procurement_orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_erp_orders_status ON public.erp_procurement_orders(status);
CREATE INDEX IF NOT EXISTS idx_erp_orders_validation_status ON public.erp_procurement_orders(validation_status);
CREATE INDEX IF NOT EXISTS idx_erp_orders_created_at ON public.erp_procurement_orders(created_at);

-- Add indices for dispatch schedules
CREATE INDEX IF NOT EXISTS idx_dispatch_schedule_status ON public.warehouse_dispatch_schedule(dispatch_status);
CREATE INDEX IF NOT EXISTS idx_dispatch_schedule_erp_order ON public.warehouse_dispatch_schedule(erp_order_id);

-- Add validation SLA tracking column (hours)
ALTER TABLE public.erp_procurement_orders 
ADD COLUMN IF NOT EXISTS validation_sla_hours INTEGER DEFAULT 24;