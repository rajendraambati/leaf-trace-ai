-- Add foreign key constraints to link tables

-- procurement_batches -> farmers
ALTER TABLE public.procurement_batches
ADD CONSTRAINT fk_procurement_batches_farmer
FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE CASCADE;

-- shipments -> procurement_batches
ALTER TABLE public.shipments
ADD CONSTRAINT fk_shipments_batch
FOREIGN KEY (batch_id) REFERENCES public.procurement_batches(id) ON DELETE CASCADE;

-- warehouse_inventory -> procurement_batches
ALTER TABLE public.warehouse_inventory
ADD CONSTRAINT fk_warehouse_inventory_batch
FOREIGN KEY (batch_id) REFERENCES public.procurement_batches(id) ON DELETE CASCADE;

-- warehouse_inventory -> warehouses
ALTER TABLE public.warehouse_inventory
ADD CONSTRAINT fk_warehouse_inventory_warehouse
FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;

-- processing_batches -> procurement_batches
ALTER TABLE public.processing_batches
ADD CONSTRAINT fk_processing_batches_batch
FOREIGN KEY (batch_id) REFERENCES public.procurement_batches(id) ON DELETE CASCADE;

-- processing_batches -> processing_units
ALTER TABLE public.processing_batches
ADD CONSTRAINT fk_processing_batches_unit
FOREIGN KEY (unit_id) REFERENCES public.processing_units(id) ON DELETE CASCADE;

-- ai_gradings -> procurement_batches
ALTER TABLE public.ai_gradings
ADD CONSTRAINT fk_ai_gradings_batch
FOREIGN KEY (batch_id) REFERENCES public.procurement_batches(id) ON DELETE CASCADE;

-- batch_quality_tests -> procurement_batches
ALTER TABLE public.batch_quality_tests
ADD CONSTRAINT fk_batch_quality_tests_batch
FOREIGN KEY (batch_id) REFERENCES public.procurement_batches(id) ON DELETE CASCADE;

-- farmer_certifications -> farmers
ALTER TABLE public.farmer_certifications
ADD CONSTRAINT fk_farmer_certifications_farmer
FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE CASCADE;

-- farmer_documents -> farmers
ALTER TABLE public.farmer_documents
ADD CONSTRAINT fk_farmer_documents_farmer
FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE CASCADE;

-- profiles -> auth.users (already exists but ensuring it's there)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_user'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_user
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;