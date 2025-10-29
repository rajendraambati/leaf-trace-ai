-- Create document templates table
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL CHECK (template_type IN ('tpd_label', 'dispatch_manifest', 'invoice', 'customs_declaration', 'packing_list')),
  name TEXT NOT NULL,
  description TEXT,
  template_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated documents table
CREATE TABLE IF NOT EXISTS public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('tpd_label', 'dispatch_manifest', 'invoice', 'customs_declaration', 'packing_list')),
  document_number TEXT NOT NULL UNIQUE,
  template_id UUID REFERENCES public.document_templates(id),
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('batch', 'shipment', 'order', 'warehouse')),
  document_data JSONB NOT NULL DEFAULT '{}',
  qr_code_data TEXT,
  pdf_url TEXT,
  generated_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document tracking table
CREATE TABLE IF NOT EXISTS public.document_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.generated_documents(id) NOT NULL,
  qr_code TEXT NOT NULL UNIQUE,
  scan_location TEXT,
  scanned_by UUID REFERENCES auth.users(id),
  scan_latitude NUMERIC,
  scan_longitude NUMERIC,
  scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scan_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice line items table
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.generated_documents(id) NOT NULL,
  item_description TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  line_total NUMERIC NOT NULL,
  batch_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_templates
CREATE POLICY "Everyone can view active templates"
  ON public.document_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON public.document_templates FOR ALL
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin')
  );

-- RLS Policies for generated_documents
CREATE POLICY "Everyone can view generated documents"
  ON public.generated_documents FOR SELECT
  USING (true);

CREATE POLICY "Authorized users can create documents"
  ON public.generated_documents FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager') OR
    has_role(auth.uid(), 'factory_manager') OR
    has_role(auth.uid(), 'technician')
  );

CREATE POLICY "Authorized users can update documents"
  ON public.generated_documents FOR UPDATE
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager')
  );

CREATE POLICY "System can insert documents"
  ON public.generated_documents FOR INSERT
  WITH CHECK (true);

-- RLS Policies for document_tracking
CREATE POLICY "Everyone can insert scan records"
  ON public.document_tracking FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Everyone can view scan records"
  ON public.document_tracking FOR SELECT
  USING (true);

CREATE POLICY "Managers can update scan records"
  ON public.document_tracking FOR UPDATE
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'admin')
  );

-- RLS Policies for invoice_line_items
CREATE POLICY "Everyone can view invoice items"
  ON public.invoice_line_items FOR SELECT
  USING (true);

CREATE POLICY "Authorized users can manage invoice items"
  ON public.invoice_line_items FOR ALL
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager')
  );

-- Create triggers
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_documents_updated_at
  BEFORE UPDATE ON public.generated_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_generated_documents_entity ON public.generated_documents(entity_id, entity_type);
CREATE INDEX idx_generated_documents_number ON public.generated_documents(document_number);
CREATE INDEX idx_document_tracking_qr ON public.document_tracking(qr_code);
CREATE INDEX idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);

-- Insert default document templates
INSERT INTO public.document_templates (template_type, name, description, template_config) VALUES
('tpd_label', 'Standard TPD Label', 'TPD-compliant tobacco product label', 
 '{
   "fields": ["product_name", "health_warning", "nicotine_content", "batch_number", "manufacture_date", "expiry_date", "manufacturer_info"],
   "health_warning_text": "Smoking seriously harms you and others around you",
   "font_sizes": {"title": 14, "warning": 10, "body": 8},
   "include_qr": true,
   "qr_position": "bottom_right"
 }'::jsonb),
('dispatch_manifest', 'Standard Dispatch Manifest', 'Shipment dispatch manifest with all details', 
 '{
   "fields": ["manifest_number", "dispatch_date", "origin", "destination", "vehicle_info", "driver_info", "batch_details", "compliance_docs"],
   "include_qr": true,
   "include_signatures": true,
   "qr_position": "top_right"
 }'::jsonb),
('invoice', 'GST Invoice', 'GST-compliant invoice template', 
 '{
   "fields": ["invoice_number", "invoice_date", "customer_info", "line_items", "subtotal", "gst_rate", "gst_amount", "total", "payment_terms"],
   "include_qr": true,
   "show_gst_breakdown": true,
   "qr_position": "bottom_right"
 }'::jsonb),
('customs_declaration', 'Standard Customs Declaration', 'Customs and excise declaration form', 
 '{
   "fields": ["declaration_number", "consignor", "consignee", "goods_description", "hs_code", "quantity", "value", "origin_country", "destination_country"],
   "include_qr": true,
   "include_compliance_docs": true,
   "qr_position": "top_left"
 }'::jsonb),
('packing_list', 'Standard Packing List', 'Detailed packing list for shipments', 
 '{
   "fields": ["list_number", "shipment_id", "package_count", "total_weight", "package_details", "handling_instructions"],
   "include_qr": true,
   "qr_position": "bottom_left"
 }'::jsonb)
ON CONFLICT DO NOTHING;