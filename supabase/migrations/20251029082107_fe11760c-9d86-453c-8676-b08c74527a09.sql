-- Create mobile checklist templates table
CREATE TABLE IF NOT EXISTS public.mobile_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('pre_trip', 'delivery', 'compliance', 'vehicle_inspection', 'post_trip')),
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  required_for_roles TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mobile checklist responses table
CREATE TABLE IF NOT EXISTS public.mobile_checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.mobile_checklist_templates(id),
  driver_id UUID REFERENCES auth.users(id) NOT NULL,
  shipment_id TEXT REFERENCES public.shipments(id),
  vehicle_id TEXT,
  checklist_type TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  photos JSONB DEFAULT '[]',
  signature_data TEXT,
  compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('passed', 'failed', 'pending', 'warning')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GPS tracking logs table
CREATE TABLE IF NOT EXISTS public.gps_tracking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) NOT NULL,
  vehicle_id TEXT,
  shipment_id TEXT REFERENCES public.shipments(id),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy NUMERIC,
  altitude NUMERIC,
  speed NUMERIC,
  heading NUMERIC,
  battery_level NUMERIC,
  is_moving BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create translation keys table for multi-language support
CREATE TABLE IF NOT EXISTS public.translation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  en TEXT NOT NULL,
  hi TEXT,
  te TEXT,
  ta TEXT,
  kn TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver wellness analytics table
CREATE TABLE IF NOT EXISTS public.driver_wellness_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) NOT NULL,
  analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  wellness_score NUMERIC NOT NULL,
  fatigue_score NUMERIC,
  stress_score NUMERIC,
  mood_score NUMERIC,
  compliance_score NUMERIC,
  total_driving_hours NUMERIC,
  total_break_time_minutes INTEGER,
  average_daily_hours NUMERIC,
  incidents_count INTEGER DEFAULT 0,
  wellness_trends JSONB,
  recommendations JSONB,
  alerts JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mobile_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_wellness_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mobile_checklist_templates
CREATE POLICY "Everyone can view checklist templates"
  ON public.mobile_checklist_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage checklist templates"
  ON public.mobile_checklist_templates FOR ALL
  USING (
    has_role(auth.uid(), 'system_admin') OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'logistics_manager')
  );

-- RLS Policies for mobile_checklist_responses
CREATE POLICY "Drivers can view own checklist responses"
  ON public.mobile_checklist_responses FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can insert own checklist responses"
  ON public.mobile_checklist_responses FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Managers can view all checklist responses"
  ON public.mobile_checklist_responses FOR SELECT
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'admin')
  );

-- RLS Policies for gps_tracking_logs
CREATE POLICY "Drivers can insert own GPS logs"
  ON public.gps_tracking_logs FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Drivers can view own GPS logs"
  ON public.gps_tracking_logs FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Managers can view all GPS logs"
  ON public.gps_tracking_logs FOR SELECT
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'admin')
  );

-- RLS Policies for translation_keys
CREATE POLICY "Everyone can view translations"
  ON public.translation_keys FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage translations"
  ON public.translation_keys FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for driver_wellness_analytics
CREATE POLICY "Drivers can view own wellness analytics"
  ON public.driver_wellness_analytics FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Managers can view all wellness analytics"
  ON public.driver_wellness_analytics FOR SELECT
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "System can insert wellness analytics"
  ON public.driver_wellness_analytics FOR INSERT
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_mobile_checklist_templates_updated_at
  BEFORE UPDATE ON public.mobile_checklist_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_keys_updated_at
  BEFORE UPDATE ON public.translation_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_gps_tracking_driver ON public.gps_tracking_logs(driver_id, timestamp DESC);
CREATE INDEX idx_gps_tracking_shipment ON public.gps_tracking_logs(shipment_id, timestamp DESC);
CREATE INDEX idx_checklist_responses_driver ON public.mobile_checklist_responses(driver_id, created_at DESC);
CREATE INDEX idx_wellness_analytics_driver ON public.driver_wellness_analytics(driver_id, analysis_period_start DESC);

-- Insert default checklist templates
INSERT INTO public.mobile_checklist_templates (checklist_type, name, description, items) VALUES
('pre_trip', 'Pre-Trip Vehicle Inspection', 'Daily vehicle safety check before starting route', 
 '[
   {"id": "tires", "label": "Check tire pressure and condition", "type": "checkbox", "required": true},
   {"id": "lights", "label": "Test all lights (headlights, brake, signals)", "type": "checkbox", "required": true},
   {"id": "brakes", "label": "Check brake function", "type": "checkbox", "required": true},
   {"id": "mirrors", "label": "Adjust mirrors", "type": "checkbox", "required": true},
   {"id": "fuel", "label": "Verify fuel level", "type": "number", "required": true, "unit": "%"},
   {"id": "documents", "label": "Check vehicle documents", "type": "checkbox", "required": true},
   {"id": "cleanliness", "label": "Vehicle interior/exterior condition", "type": "rating", "required": false},
   {"id": "odometer", "label": "Starting odometer reading", "type": "number", "required": true}
 ]'::jsonb),
('delivery', 'Delivery Confirmation', 'Confirm successful delivery with recipient', 
 '[
   {"id": "recipient_name", "label": "Recipient Name", "type": "text", "required": true},
   {"id": "recipient_phone", "label": "Recipient Phone", "type": "text", "required": false},
   {"id": "condition", "label": "Package Condition", "type": "select", "options": ["Excellent", "Good", "Damaged"], "required": true},
   {"id": "signature", "label": "Recipient Signature", "type": "signature", "required": true},
   {"id": "photo", "label": "Delivery Photo", "type": "photo", "required": true},
   {"id": "notes", "label": "Delivery Notes", "type": "textarea", "required": false}
 ]'::jsonb),
('compliance', 'Compliance Document Check', 'Verify all compliance documents', 
 '[
   {"id": "emd", "label": "EMD Document", "type": "checkbox", "required": true},
   {"id": "bg", "label": "BG Document", "type": "checkbox", "required": true},
   {"id": "gst", "label": "GST Document", "type": "checkbox", "required": true},
   {"id": "tender", "label": "Tender Document", "type": "checkbox", "required": true},
   {"id": "customs", "label": "Customs Clearance", "type": "checkbox", "required": false},
   {"id": "excise", "label": "Excise Document", "type": "checkbox", "required": false}
 ]'::jsonb),
('vehicle_inspection', 'Post-Delivery Vehicle Inspection', 'End-of-day vehicle check', 
 '[
   {"id": "damage", "label": "Any new damage or issues", "type": "checkbox", "required": true},
   {"id": "cleanliness", "label": "Vehicle cleaned", "type": "checkbox", "required": true},
   {"id": "fuel_end", "label": "Ending fuel level", "type": "number", "required": true, "unit": "%"},
   {"id": "odometer_end", "label": "Ending odometer reading", "type": "number", "required": true},
   {"id": "maintenance", "label": "Maintenance needed", "type": "textarea", "required": false}
 ]'::jsonb);

-- Insert default translations
INSERT INTO public.translation_keys (key_name, en, hi, te, ta, kn, category) VALUES
('app.welcome', 'Welcome', 'स्वागत है', 'స్వాగతం', 'வரவேற்பு', 'ಸ್ವಾಗತ', 'common'),
('app.home', 'Home', 'होम', 'హోమ్', 'முகப்பு', 'ಮುಖಪುಟ', 'common'),
('app.profile', 'Profile', 'प्रोफ़ाइल', 'ప్రొఫైల్', 'சுயவிவரம்', 'ಪ್ರೊಫೈಲ್', 'common'),
('app.logout', 'Logout', 'लॉग आउट', 'లాగౌట్', 'வெளியேறு', 'ಲಾಗೌಟ್', 'common'),
('delivery.confirm', 'Confirm Delivery', 'डिलीवरी की पुष्टि करें', 'డెలివరీ నిర్ధారించండి', 'விநியோகத்தை உறுதிப்படுத்தவும்', 'ವಿತರಣೆಯನ್ನು ದೃಢೀಕರಿಸಿ', 'delivery'),
('delivery.recipient', 'Recipient Name', 'प्राप्तकर्ता का नाम', 'స్వీకర్త పేరు', 'பெறுநர் பெயர்', 'ಸ್ವೀಕರಿಸುವವರ ಹೆಸರು', 'delivery'),
('wellness.mood', 'How are you feeling?', 'आप कैसा महसूस कर रहे हैं?', 'మీరు ఎలా అనుభూతి చెందుతున్నారు?', 'உங்களுக்கு எப்படி உணர்கிறீர்கள்?', 'ನೀವು ಹೇಗೆ ಅನುಭವಿಸುತ್ತಿದ್ದೀರಿ?', 'wellness'),
('wellness.fatigue', 'Fatigue Level', 'थकान का स्तर', 'అలసట స్థాయి', 'சோர்வு நிலை', 'ಆಯಾಸ ಮಟ್ಟ', 'wellness'),
('checklist.pretrip', 'Pre-Trip Inspection', 'यात्रा-पूर्व निरीक्षण', 'ప్రీ-ట్రిప్ తనిఖీ', 'பயணத்துக்கு முந்தைய பரிசோதனை', 'ಪ್ರಯಾಣ-ಪೂರ್ವ ತಪಾಸಣೆ', 'checklist'),
('checklist.complete', 'Complete Checklist', 'चेकलिस्ट पूरा करें', 'తనిఖీ జాబితాను పూర్తి చేయండి', 'சரிபார்ப்புப் பட்டியலை முடிக்கவும்', 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ', 'checklist'),
('gps.tracking', 'GPS Tracking', 'जीपीएस ट्रैकिंग', 'GPS ట్రాకింగ్', 'GPS கண்காணிப்பு', 'GPS ಟ್ರ್ಯಾಕಿಂಗ್', 'navigation'),
('gps.location', 'Current Location', 'वर्तमान स्थान', 'ప్రస్తుత స్థానం', 'தற்போதைய இடம்', 'ಪ್ರಸ್ತುತ ಸ್ಥಳ', 'navigation')
ON CONFLICT (key_name) DO NOTHING;