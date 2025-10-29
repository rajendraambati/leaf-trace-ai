-- Create sales representatives table
CREATE TABLE public.sales_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  employee_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  territory TEXT,
  region TEXT,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  hired_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create retailers table
CREATE TABLE public.retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_code TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country_id UUID REFERENCES public.countries(id),
  license_number TEXT,
  tax_id TEXT,
  business_type TEXT DEFAULT 'retail_store',
  onboarding_status TEXT DEFAULT 'pending',
  onboarding_date DATE DEFAULT CURRENT_DATE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  credit_limit NUMERIC DEFAULT 0,
  payment_terms TEXT DEFAULT 'Net 30',
  assigned_sales_rep_id UUID REFERENCES public.sales_representatives(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create retailer orders table
CREATE TABLE public.retailer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  retailer_id UUID REFERENCES public.retailers(id) NOT NULL,
  sales_rep_id UUID REFERENCES public.sales_representatives(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  total_quantity_kg NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  order_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  order_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  special_instructions TEXT,
  erp_order_id TEXT,
  erp_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create promotional campaigns table
CREATE TABLE public.promotional_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_code TEXT NOT NULL UNIQUE,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  target_audience TEXT,
  discount_percentage NUMERIC,
  discount_amount NUMERIC,
  budget NUMERIC,
  spent_amount NUMERIC DEFAULT 0,
  performance_data JSONB DEFAULT '{}'::jsonb,
  terms_conditions TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Create campaign participants table
CREATE TABLE public.campaign_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.promotional_campaigns(id) ON DELETE CASCADE NOT NULL,
  retailer_id UUID REFERENCES public.retailers(id) ON DELETE CASCADE NOT NULL,
  enrollment_date TIMESTAMPTZ DEFAULT now(),
  orders_count INTEGER DEFAULT 0,
  total_purchases NUMERIC DEFAULT 0,
  total_discount_applied NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, retailer_id)
);

-- Create wholesaler ERP sync logs table
CREATE TABLE public.wholesaler_erp_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_ids TEXT[] NOT NULL,
  direction TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  sync_started_at TIMESTAMPTZ DEFAULT now(),
  sync_completed_at TIMESTAMPTZ,
  initiated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_sales_reps_user_id ON public.sales_representatives(user_id);
CREATE INDEX idx_sales_reps_active ON public.sales_representatives(is_active);
CREATE INDEX idx_retailers_code ON public.retailers(retailer_code);
CREATE INDEX idx_retailers_sales_rep ON public.retailers(assigned_sales_rep_id);
CREATE INDEX idx_retailers_status ON public.retailers(onboarding_status);
CREATE INDEX idx_retailer_orders_retailer ON public.retailer_orders(retailer_id);
CREATE INDEX idx_retailer_orders_sales_rep ON public.retailer_orders(sales_rep_id);
CREATE INDEX idx_retailer_orders_status ON public.retailer_orders(order_status);
CREATE INDEX idx_campaigns_status ON public.promotional_campaigns(status);
CREATE INDEX idx_campaigns_dates ON public.promotional_campaigns(start_date, end_date);
CREATE INDEX idx_campaign_participants_campaign ON public.campaign_participants(campaign_id);
CREATE INDEX idx_campaign_participants_retailer ON public.campaign_participants(retailer_id);
CREATE INDEX idx_erp_sync_logs_type ON public.wholesaler_erp_sync_logs(sync_type, entity_type);

-- Enable RLS
ALTER TABLE public.sales_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesaler_erp_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_representatives
CREATE POLICY "Admins can manage sales reps"
  ON public.sales_representatives
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Sales reps can view own profile"
  ON public.sales_representatives
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for retailers
CREATE POLICY "Authorized users can view retailers"
  ON public.retailers
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'system_admin'::app_role) OR 
    has_role(auth.uid(), 'logistics_manager'::app_role) OR
    EXISTS (SELECT 1 FROM public.sales_representatives WHERE user_id = auth.uid() AND id = retailers.assigned_sales_rep_id)
  );

CREATE POLICY "Admins and sales reps can create retailers"
  ON public.retailers
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'system_admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.sales_representatives WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can update retailers"
  ON public.retailers
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- RLS Policies for retailer_orders
CREATE POLICY "Authorized users can view retailer orders"
  ON public.retailer_orders
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'system_admin'::app_role) OR 
    has_role(auth.uid(), 'logistics_manager'::app_role) OR
    EXISTS (SELECT 1 FROM public.sales_representatives WHERE user_id = auth.uid() AND id = retailer_orders.sales_rep_id)
  );

CREATE POLICY "Authorized users can create retailer orders"
  ON public.retailer_orders
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'system_admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.sales_representatives WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can update retailer orders"
  ON public.retailer_orders
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- RLS Policies for promotional_campaigns
CREATE POLICY "Everyone can view active campaigns"
  ON public.promotional_campaigns
  FOR SELECT
  USING (status = 'active' OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Admins can manage campaigns"
  ON public.promotional_campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- RLS Policies for campaign_participants
CREATE POLICY "Authorized users can view campaign participants"
  ON public.campaign_participants
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'system_admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.sales_representatives sr JOIN public.retailers r ON sr.id = r.assigned_sales_rep_id WHERE sr.user_id = auth.uid() AND r.id = campaign_participants.retailer_id)
  );

CREATE POLICY "Admins can manage campaign participants"
  ON public.campaign_participants
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- RLS Policies for wholesaler_erp_sync_logs
CREATE POLICY "Admins can view sync logs"
  ON public.wholesaler_erp_sync_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "System can insert sync logs"
  ON public.wholesaler_erp_sync_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update sync logs"
  ON public.wholesaler_erp_sync_logs
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_sales_representatives_updated_at BEFORE UPDATE ON public.sales_representatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_retailers_updated_at BEFORE UPDATE ON public.retailers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_retailer_orders_updated_at BEFORE UPDATE ON public.retailer_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotional_campaigns_updated_at BEFORE UPDATE ON public.promotional_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();