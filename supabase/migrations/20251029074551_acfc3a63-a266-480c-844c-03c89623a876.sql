-- Create serialized_units table for individual tobacco packs/units
CREATE TABLE public.serialized_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  unit_type TEXT NOT NULL, -- 'pack', 'carton', 'pallet'
  batch_id TEXT REFERENCES public.procurement_batches(id),
  parent_serial TEXT, -- For aggregation (e.g., carton contains packs)
  product_code TEXT NOT NULL,
  manufacturing_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- active, aggregated, shipped, sold, destroyed, reworked
  current_location TEXT,
  current_location_type TEXT, -- warehouse, processing_unit, transit, customer
  current_warehouse_id TEXT REFERENCES public.warehouses(id),
  current_shipment_id TEXT REFERENCES public.shipments(id),
  eu_tpd_id TEXT, -- EU Tobacco Products Directive ID
  gcc_traceability_id TEXT, -- GCC traceability system ID
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_serialized_units_serial ON public.serialized_units(serial_number);
CREATE INDEX idx_serialized_units_batch ON public.serialized_units(batch_id);
CREATE INDEX idx_serialized_units_parent ON public.serialized_units(parent_serial);
CREATE INDEX idx_serialized_units_status ON public.serialized_units(status);
CREATE INDEX idx_serialized_units_shipment ON public.serialized_units(current_shipment_id);

-- Create serial_movements table for tracking all movements
CREATE TABLE public.serial_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT NOT NULL,
  movement_type TEXT NOT NULL, -- created, aggregated, disaggregated, shipped, received, reworked, destroyed
  from_location TEXT,
  to_location TEXT,
  from_location_type TEXT,
  to_location_type TEXT,
  shipment_id TEXT REFERENCES public.shipments(id),
  warehouse_id TEXT REFERENCES public.warehouses(id),
  user_id UUID,
  notes TEXT,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_serial_movements_serial ON public.serial_movements(serial_number);
CREATE INDEX idx_serial_movements_type ON public.serial_movements(movement_type);
CREATE INDEX idx_serial_movements_timestamp ON public.serial_movements(timestamp);
CREATE INDEX idx_serial_movements_shipment ON public.serial_movements(shipment_id);

-- Create aggregation_relationships table for parent-child tracking
CREATE TABLE public.aggregation_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_serial TEXT NOT NULL,
  child_serial TEXT NOT NULL,
  aggregation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  disaggregation_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- active, disaggregated
  aggregated_by UUID,
  disaggregated_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(parent_serial, child_serial)
);

CREATE INDEX idx_aggregation_parent ON public.aggregation_relationships(parent_serial);
CREATE INDEX idx_aggregation_child ON public.aggregation_relationships(child_serial);
CREATE INDEX idx_aggregation_status ON public.aggregation_relationships(status);

-- Create compliance_sync_logs table for TPD and GCC sync tracking
CREATE TABLE public.compliance_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- eu_tpd, gcc_traceability
  sync_direction TEXT NOT NULL, -- upload, download, bidirectional
  serial_numbers TEXT[] NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  initiated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_compliance_sync_type ON public.compliance_sync_logs(sync_type);
CREATE INDEX idx_compliance_sync_status ON public.compliance_sync_logs(status);
CREATE INDEX idx_compliance_sync_started ON public.compliance_sync_logs(sync_started_at);

-- Create rework_actions table for tracking rework operations
CREATE TABLE public.rework_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT NOT NULL,
  rework_type TEXT NOT NULL, -- repackaging, relabeling, quality_correction, return_processing
  reason TEXT NOT NULL,
  original_status TEXT,
  new_status TEXT,
  original_parent_serial TEXT,
  new_parent_serial TEXT,
  performed_by UUID,
  approved_by UUID,
  notes TEXT,
  before_metadata JSONB,
  after_metadata JSONB,
  rework_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_rework_serial ON public.rework_actions(serial_number);
CREATE INDEX idx_rework_type ON public.rework_actions(rework_type);
CREATE INDEX idx_rework_date ON public.rework_actions(rework_date);

-- Add serialization support to procurement_batches
ALTER TABLE public.procurement_batches 
ADD COLUMN IF NOT EXISTS serialization_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS serialization_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS serialization_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_units_serialized INTEGER DEFAULT 0;

-- Add serialization tracking to shipments
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS serialized_units TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS serialization_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS serialization_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS serialization_verified_by UUID;

-- Enable RLS
ALTER TABLE public.serialized_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregation_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rework_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for serialized_units
CREATE POLICY "Everyone can view serialized units" ON public.serialized_units
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can create serialized units" ON public.serialized_units
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'technician') OR 
    has_role(auth.uid(), 'procurement_agent') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authorized users can update serialized units" ON public.serialized_units
  FOR UPDATE USING (
    has_role(auth.uid(), 'technician') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'admin')
  );

-- RLS Policies for serial_movements
CREATE POLICY "Everyone can view serial movements" ON public.serial_movements
  FOR SELECT USING (true);

CREATE POLICY "System can insert serial movements" ON public.serial_movements
  FOR INSERT WITH CHECK (true);

-- RLS Policies for aggregation_relationships
CREATE POLICY "Everyone can view aggregation relationships" ON public.aggregation_relationships
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage aggregation" ON public.aggregation_relationships
  FOR ALL USING (
    has_role(auth.uid(), 'technician') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'admin')
  );

-- RLS Policies for compliance_sync_logs
CREATE POLICY "Auditors can view compliance sync logs" ON public.compliance_sync_logs
  FOR SELECT USING (
    has_role(auth.uid(), 'auditor') OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can insert compliance sync logs" ON public.compliance_sync_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update compliance sync logs" ON public.compliance_sync_logs
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for rework_actions
CREATE POLICY "Everyone can view rework actions" ON public.rework_actions
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can create rework actions" ON public.rework_actions
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'technician') OR 
    has_role(auth.uid(), 'admin')
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_serialized_units_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_serialized_units_updated_at
  BEFORE UPDATE ON public.serialized_units
  FOR EACH ROW
  EXECUTE FUNCTION update_serialized_units_updated_at();

-- Trigger to log serial movements automatically
CREATE OR REPLACE FUNCTION log_serial_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.serial_movements (
      serial_number,
      movement_type,
      to_location,
      to_location_type,
      metadata
    ) VALUES (
      NEW.serial_number,
      'created',
      NEW.current_location,
      NEW.current_location_type,
      jsonb_build_object('initial_creation', true, 'batch_id', NEW.batch_id)
    );
  ELSIF TG_OP = 'UPDATE' AND (OLD.current_location != NEW.current_location OR OLD.status != NEW.status) THEN
    INSERT INTO public.serial_movements (
      serial_number,
      movement_type,
      from_location,
      to_location,
      from_location_type,
      to_location_type,
      shipment_id,
      warehouse_id,
      metadata
    ) VALUES (
      NEW.serial_number,
      CASE 
        WHEN NEW.status = 'shipped' THEN 'shipped'
        WHEN NEW.status = 'aggregated' THEN 'aggregated'
        WHEN NEW.status = 'reworked' THEN 'reworked'
        ELSE 'moved'
      END,
      OLD.current_location,
      NEW.current_location,
      OLD.current_location_type,
      NEW.current_location_type,
      NEW.current_shipment_id,
      NEW.current_warehouse_id,
      jsonb_build_object('status_change', OLD.status || ' -> ' || NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_serial_movement
  AFTER INSERT OR UPDATE ON public.serialized_units
  FOR EACH ROW
  EXECUTE FUNCTION log_serial_movement();