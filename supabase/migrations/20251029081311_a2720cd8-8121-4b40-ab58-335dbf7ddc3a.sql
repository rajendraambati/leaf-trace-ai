-- Create compliance documents table
CREATE TABLE IF NOT EXISTS public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('emd', 'bg', 'gst', 'tender', 'customs', 'excise')),
  document_number TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('batch', 'shipment', 'warehouse', 'processing_unit', 'farmer', 'vehicle')),
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  document_url TEXT,
  region TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'pending')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create compliance validation results table
CREATE TABLE IF NOT EXISTS public.compliance_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  validation_type TEXT NOT NULL CHECK (validation_type IN ('pre_dispatch', 'customs', 'excise', 'manual')),
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('passed', 'failed', 'pending', 'warning')),
  required_documents TEXT[] NOT NULL,
  missing_documents TEXT[],
  expired_documents TEXT[],
  validation_details JSONB DEFAULT '{}',
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regulatory reports table
CREATE TABLE IF NOT EXISTS public.regulatory_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('customs', 'excise', 'gst', 'compliance_summary')),
  region TEXT NOT NULL,
  report_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  report_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  report_data JSONB NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  report_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dispatch compliance checks table
CREATE TABLE IF NOT EXISTS public.dispatch_compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID,
  shipment_id TEXT REFERENCES public.shipments(id),
  batch_id TEXT REFERENCES public.procurement_batches(id),
  compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('cleared', 'blocked', 'pending', 'warning')),
  blocking_issues TEXT[],
  warnings TEXT[],
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cleared_at TIMESTAMP WITH TIME ZONE,
  cleared_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_compliance_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_documents
CREATE POLICY "Users can view compliance documents based on role"
  ON public.compliance_documents FOR SELECT
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'factory_manager') OR
    has_role(auth.uid(), 'technician')
  );

CREATE POLICY "Admins can insert compliance documents"
  ON public.compliance_documents FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'factory_manager')
  );

CREATE POLICY "Admins can update compliance documents"
  ON public.compliance_documents FOR UPDATE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'factory_manager')
  );

-- RLS Policies for compliance_validations
CREATE POLICY "Users can view compliance validations based on role"
  ON public.compliance_validations FOR SELECT
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'factory_manager')
  );

CREATE POLICY "System can insert compliance validations"
  ON public.compliance_validations FOR INSERT
  WITH CHECK (true);

-- RLS Policies for regulatory_reports
CREATE POLICY "Users can view regulatory reports based on role"
  ON public.regulatory_reports FOR SELECT
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins can insert regulatory reports"
  ON public.regulatory_reports FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'auditor')
  );

CREATE POLICY "Admins can update regulatory reports"
  ON public.regulatory_reports FOR UPDATE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'auditor')
  );

-- RLS Policies for dispatch_compliance_checks
CREATE POLICY "Users can view dispatch compliance checks based on role"
  ON public.dispatch_compliance_checks FOR SELECT
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'factory_manager')
  );

CREATE POLICY "System can insert dispatch compliance checks"
  ON public.dispatch_compliance_checks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update dispatch compliance checks"
  ON public.dispatch_compliance_checks FOR UPDATE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager')
  );

-- Create trigger for updating updated_at
CREATE TRIGGER update_compliance_documents_updated_at
  BEFORE UPDATE ON public.compliance_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulatory_reports_updated_at
  BEFORE UPDATE ON public.regulatory_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_compliance_documents_entity ON public.compliance_documents(entity_id, entity_type);
CREATE INDEX idx_compliance_documents_expiry ON public.compliance_documents(expiry_date) WHERE status = 'active';
CREATE INDEX idx_compliance_validations_entity ON public.compliance_validations(entity_id, entity_type);
CREATE INDEX idx_dispatch_compliance_checks_shipment ON public.dispatch_compliance_checks(shipment_id);
CREATE INDEX idx_regulatory_reports_region ON public.regulatory_reports(region, report_type);