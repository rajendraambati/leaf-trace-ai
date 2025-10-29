-- Create countries table for multi-country support
CREATE TABLE IF NOT EXISTS public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  region TEXT,
  compliance_framework TEXT,
  hs_code_prefix TEXT,
  tax_rate NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  regulatory_authority TEXT,
  reporting_endpoint TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create compliance rules table
CREATE TABLE IF NOT EXISTS public.compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  rule_config JSONB NOT NULL DEFAULT '{}',
  severity TEXT DEFAULT 'medium',
  is_mandatory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country_id UUID REFERENCES public.countries(id),
  postal_code TEXT,
  tax_id TEXT,
  customer_type TEXT DEFAULT 'distributor',
  credit_limit NUMERIC DEFAULT 0,
  payment_terms TEXT DEFAULT 'Net 30',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create target markets table
CREATE TABLE IF NOT EXISTS public.target_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_name TEXT NOT NULL,
  country_id UUID REFERENCES public.countries(id),
  market_segment TEXT,
  target_volume_kg NUMERIC,
  current_volume_kg NUMERIC DEFAULT 0,
  market_share_percentage NUMERIC,
  primary_products JSONB DEFAULT '[]',
  distribution_channels JSONB DEFAULT '[]',
  pricing_strategy TEXT,
  compliance_requirements JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reporting authorities table
CREATE TABLE IF NOT EXISTS public.reporting_authorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_name TEXT NOT NULL,
  authority_code TEXT NOT NULL UNIQUE,
  country_id UUID REFERENCES public.countries(id),
  authority_type TEXT NOT NULL,
  reporting_frequency TEXT DEFAULT 'monthly',
  endpoint_url TEXT,
  api_key_name TEXT,
  authentication_method TEXT DEFAULT 'api_key',
  report_format TEXT DEFAULT 'json',
  required_fields JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_report_date TIMESTAMPTZ,
  next_report_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create compliance reports table
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number TEXT NOT NULL UNIQUE,
  authority_id UUID REFERENCES public.reporting_authorities(id),
  country_id UUID REFERENCES public.countries(id),
  report_type TEXT NOT NULL,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  submission_status TEXT DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  acknowledgment_number TEXT,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create country-specific document templates table
CREATE TABLE IF NOT EXISTS public.country_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES public.countries(id),
  document_type TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_config JSONB NOT NULL DEFAULT '{}',
  compliance_fields JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customer orders table
CREATE TABLE IF NOT EXISTS public.customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  target_market_id UUID REFERENCES public.target_markets(id),
  order_date DATE NOT NULL,
  delivery_date DATE,
  order_status TEXT DEFAULT 'pending',
  total_quantity_kg NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  special_instructions TEXT,
  order_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_countries_code ON public.countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_active ON public.countries(is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_country ON public.compliance_rules(country_id);
CREATE INDEX IF NOT EXISTS idx_customers_country ON public.customers(country_id);
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_target_markets_country ON public.target_markets(country_id);
CREATE INDEX IF NOT EXISTS idx_reporting_authorities_country ON public.reporting_authorities(country_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_authority ON public.compliance_reports(authority_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON public.compliance_reports(submission_status);
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer ON public.customer_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_status ON public.customer_orders(order_status);

-- Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporting_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view active countries"
  ON public.countries FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage countries"
  ON public.countries FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Everyone can view active compliance rules"
  ON public.compliance_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage compliance rules"
  ON public.compliance_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Authorized users can view customers"
  ON public.customers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role) OR has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'factory_manager'::app_role) OR has_role(auth.uid(), 'technician'::app_role));

CREATE POLICY "Authorized users can manage customers"
  ON public.customers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role) OR has_role(auth.uid(), 'logistics_manager'::app_role));

CREATE POLICY "Everyone can view active target markets"
  ON public.target_markets FOR SELECT
  USING (is_active = true);

CREATE POLICY "Managers can manage target markets"
  ON public.target_markets FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role) OR has_role(auth.uid(), 'logistics_manager'::app_role));

CREATE POLICY "Authorized users can view reporting authorities"
  ON public.reporting_authorities FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Admins can manage reporting authorities"
  ON public.reporting_authorities FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Authorized users can view compliance reports"
  ON public.compliance_reports FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Authorized users can create compliance reports"
  ON public.compliance_reports FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Authorized users can update compliance reports"
  ON public.compliance_reports FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Everyone can view active country templates"
  ON public.country_document_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage country templates"
  ON public.country_document_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Authorized users can view customer orders"
  ON public.customer_orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role) OR has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'factory_manager'::app_role) OR has_role(auth.uid(), 'technician'::app_role));

CREATE POLICY "Authorized users can manage customer orders"
  ON public.customer_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role) OR has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'factory_manager'::app_role));

-- Insert default countries
INSERT INTO public.countries (code, name, region, compliance_framework, hs_code_prefix, tax_rate, currency, regulatory_authority) VALUES
  ('IN', 'India', 'Asia', 'FCTC', '2401', 18, 'INR', 'Central Board of Indirect Taxes and Customs'),
  ('UAE', 'United Arab Emirates', 'Middle East', 'GCC', '2401', 5, 'AED', 'Federal Tax Authority'),
  ('SA', 'Saudi Arabia', 'Middle East', 'GCC', '2401', 15, 'SAR', 'General Authority of Zakat and Tax'),
  ('GB', 'United Kingdom', 'Europe', 'TPD', '2401', 20, 'GBP', 'HMRC'),
  ('DE', 'Germany', 'Europe', 'TPD', '2401', 19, 'EUR', 'Federal Ministry of Finance'),
  ('US', 'United States', 'North America', 'FDA', '2401', 0, 'USD', 'Food and Drug Administration')
ON CONFLICT (code) DO NOTHING;