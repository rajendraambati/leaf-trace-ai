-- Create role enum for user roles
CREATE TYPE public.app_role AS ENUM ('farmer', 'technician', 'procurement_agent', 'logistics_manager', 'factory_manager', 'auditor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Farmers table
CREATE TABLE public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  farm_size_acres DECIMAL(10,2),
  geo_latitude DECIMAL(10,8),
  geo_longitude DECIMAL(11,8),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farmer documents
CREATE TABLE public.farmer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farmer certifications
CREATE TABLE public.farmer_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issuer TEXT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procurement batches
CREATE TABLE public.procurement_batches (
  id TEXT PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES public.farmers(id),
  quantity_kg DECIMAL(10,2) NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('Premium', 'Standard', 'Low')),
  price_per_kg DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
  procurement_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing')),
  qr_code TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality tests
CREATE TABLE public.batch_quality_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL REFERENCES public.procurement_batches(id) ON DELETE CASCADE,
  moisture_content DECIMAL(5,2),
  nicotine_level DECIMAL(5,2),
  sugar_content DECIMAL(5,2),
  test_date TIMESTAMPTZ DEFAULT NOW(),
  tested_by UUID REFERENCES auth.users(id),
  ai_grade TEXT,
  ai_confidence DECIMAL(5,2),
  notes TEXT
);

-- Shipments/Logistics
CREATE TABLE public.shipments (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES public.procurement_batches(id),
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  driver_name TEXT,
  vehicle_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-transit', 'delivered', 'cancelled')),
  departure_time TIMESTAMPTZ,
  eta TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  temperature_min DECIMAL(5,2),
  temperature_max DECIMAL(5,2),
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouses
CREATE TABLE public.warehouses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  max_capacity_kg DECIMAL(12,2) NOT NULL,
  current_stock_kg DECIMAL(12,2) DEFAULT 0,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouse inventory
CREATE TABLE public.warehouse_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id TEXT NOT NULL REFERENCES public.warehouses(id),
  batch_id TEXT NOT NULL REFERENCES public.procurement_batches(id),
  quantity_kg DECIMAL(10,2) NOT NULL,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  exit_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processing units
CREATE TABLE public.processing_units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capacity_kg_per_day DECIMAL(10,2),
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'processing', 'maintenance', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processing batches
CREATE TABLE public.processing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id TEXT NOT NULL REFERENCES public.processing_units(id),
  batch_id TEXT NOT NULL REFERENCES public.procurement_batches(id),
  input_quantity_kg DECIMAL(10,2) NOT NULL,
  output_quantity_kg DECIMAL(10,2),
  progress DECIMAL(5,2) DEFAULT 0,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  quality_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance certifications
CREATE TABLE public.compliance_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  certificate_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'suspended')),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance audits
CREATE TABLE public.compliance_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type TEXT NOT NULL,
  audit_date DATE NOT NULL,
  auditor_name TEXT,
  score DECIMAL(5,2),
  findings TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'in-progress', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESG scores
CREATE TABLE public.esg_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('farmer', 'batch', 'warehouse', 'processing')),
  entity_id TEXT NOT NULL,
  environmental_score DECIMAL(5,2),
  social_score DECIMAL(5,2),
  governance_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  assessed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- AI gradings
CREATE TABLE public.ai_gradings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL REFERENCES public.procurement_batches(id),
  image_url TEXT,
  ai_grade TEXT,
  quality_score DECIMAL(5,2),
  crop_health_score DECIMAL(5,2),
  esg_score DECIMAL(5,2),
  defects_detected TEXT[],
  recommendations TEXT[],
  confidence DECIMAL(5,2),
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_quality_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_gradings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'auditor'));

-- RLS Policies for farmers
CREATE POLICY "Everyone can view farmers" ON public.farmers FOR SELECT USING (true);
CREATE POLICY "Technicians and procurement agents can manage farmers" ON public.farmers 
  FOR ALL USING (
    public.has_role(auth.uid(), 'technician') OR 
    public.has_role(auth.uid(), 'procurement_agent') OR
    public.has_role(auth.uid(), 'auditor')
  );
CREATE POLICY "Farmers can view own profile" ON public.farmers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Farmers can update own profile" ON public.farmers FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for procurement_batches
CREATE POLICY "Everyone can view batches" ON public.procurement_batches FOR SELECT USING (true);
CREATE POLICY "Procurement agents can create batches" ON public.procurement_batches 
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'procurement_agent') OR public.has_role(auth.uid(), 'auditor'));
CREATE POLICY "Procurement agents can update batches" ON public.procurement_batches 
  FOR UPDATE USING (public.has_role(auth.uid(), 'procurement_agent') OR public.has_role(auth.uid(), 'auditor'));

-- RLS Policies for shipments
CREATE POLICY "Everyone can view shipments" ON public.shipments FOR SELECT USING (true);
CREATE POLICY "Logistics managers can manage shipments" ON public.shipments 
  FOR ALL USING (public.has_role(auth.uid(), 'logistics_manager') OR public.has_role(auth.uid(), 'auditor'));

-- RLS Policies for warehouses
CREATE POLICY "Everyone can view warehouses" ON public.warehouses FOR SELECT USING (true);
CREATE POLICY "Factory managers can manage warehouses" ON public.warehouses 
  FOR ALL USING (public.has_role(auth.uid(), 'factory_manager') OR public.has_role(auth.uid(), 'auditor'));

-- RLS Policies for processing
CREATE POLICY "Everyone can view processing units" ON public.processing_units FOR SELECT USING (true);
CREATE POLICY "Factory managers can manage processing" ON public.processing_units 
  FOR ALL USING (public.has_role(auth.uid(), 'factory_manager') OR public.has_role(auth.uid(), 'auditor'));

CREATE POLICY "Everyone can view processing batches" ON public.processing_batches FOR SELECT USING (true);
CREATE POLICY "Factory managers can manage processing batches" ON public.processing_batches 
  FOR ALL USING (public.has_role(auth.uid(), 'factory_manager') OR public.has_role(auth.uid(), 'auditor'));

-- RLS Policies for compliance
CREATE POLICY "Everyone can view certifications" ON public.compliance_certifications FOR SELECT USING (true);
CREATE POLICY "Auditors can manage certifications" ON public.compliance_certifications 
  FOR ALL USING (public.has_role(auth.uid(), 'auditor'));

CREATE POLICY "Everyone can view audits" ON public.compliance_audits FOR SELECT USING (true);
CREATE POLICY "Auditors can manage audits" ON public.compliance_audits 
  FOR ALL USING (public.has_role(auth.uid(), 'auditor'));

-- RLS Policies for ESG scores
CREATE POLICY "Everyone can view ESG scores" ON public.esg_scores FOR SELECT USING (true);
CREATE POLICY "Technicians and auditors can create ESG scores" ON public.esg_scores 
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'auditor'));

-- RLS Policies for AI gradings
CREATE POLICY "Everyone can view AI gradings" ON public.ai_gradings FOR SELECT USING (true);
CREATE POLICY "Technicians can create AI gradings" ON public.ai_gradings 
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'auditor'));

-- RLS for supporting tables
CREATE POLICY "Everyone can view farmer documents" ON public.farmer_documents FOR SELECT USING (true);
CREATE POLICY "Technicians can manage farmer documents" ON public.farmer_documents 
  FOR ALL USING (public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'auditor'));

CREATE POLICY "Everyone can view farmer certifications" ON public.farmer_certifications FOR SELECT USING (true);
CREATE POLICY "Technicians can manage farmer certifications" ON public.farmer_certifications 
  FOR ALL USING (public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'auditor'));

CREATE POLICY "Everyone can view quality tests" ON public.batch_quality_tests FOR SELECT USING (true);
CREATE POLICY "Technicians can manage quality tests" ON public.batch_quality_tests 
  FOR ALL USING (public.has_role(auth.uid(), 'technician') OR public.has_role(auth.uid(), 'auditor'));

CREATE POLICY "Everyone can view warehouse inventory" ON public.warehouse_inventory FOR SELECT USING (true);
CREATE POLICY "Factory and logistics managers can manage inventory" ON public.warehouse_inventory 
  FOR ALL USING (
    public.has_role(auth.uid(), 'factory_manager') OR 
    public.has_role(auth.uid(), 'logistics_manager') OR
    public.has_role(auth.uid(), 'auditor')
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON public.farmers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procurement_batches_updated_at BEFORE UPDATE ON public.procurement_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();