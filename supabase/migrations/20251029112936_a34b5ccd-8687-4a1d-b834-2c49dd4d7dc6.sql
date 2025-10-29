-- Mobile checklist templates
CREATE TABLE IF NOT EXISTS public.mobile_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  checklist_type TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_for_roles TEXT[] DEFAULT ARRAY['driver']::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mobile checklist responses
CREATE TABLE IF NOT EXISTS public.mobile_checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.mobile_checklist_templates(id),
  driver_id UUID,
  shipment_id TEXT,
  vehicle_id TEXT,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  location_name TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  signature_url TEXT,
  completion_status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Translations table
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  language TEXT NOT NULL,
  value TEXT NOT NULL,
  module TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(key, language, module)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_translations_lookup ON public.translations(key, language, module);

-- RLS Policies
ALTER TABLE public.mobile_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view active checklist templates" ON public.mobile_checklist_templates;
CREATE POLICY "Everyone can view active checklist templates"
  ON public.mobile_checklist_templates FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage checklist templates" ON public.mobile_checklist_templates;
CREATE POLICY "Admins can manage checklist templates"
  ON public.mobile_checklist_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));

DROP POLICY IF EXISTS "Drivers can create checklist responses" ON public.mobile_checklist_responses;
CREATE POLICY "Drivers can create checklist responses"
  ON public.mobile_checklist_responses FOR INSERT
  WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS "Drivers can view own checklist responses" ON public.mobile_checklist_responses;
CREATE POLICY "Drivers can view own checklist responses"
  ON public.mobile_checklist_responses FOR SELECT
  USING (driver_id = auth.uid() OR has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Drivers can update own responses" ON public.mobile_checklist_responses;
CREATE POLICY "Drivers can update own responses"
  ON public.mobile_checklist_responses FOR UPDATE
  USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Everyone can read translations" ON public.translations;
CREATE POLICY "Everyone can read translations"
  ON public.translations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage translations" ON public.translations;
CREATE POLICY "Admins can manage translations"
  ON public.translations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role));