-- Add driver-specific tables and columns
CREATE TABLE IF NOT EXISTS public.driver_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) NOT NULL,
  vehicle_id TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'on-break', 'in-delivery')),
  current_latitude NUMERIC,
  current_longitude NUMERIC,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Delivery confirmations table
CREATE TABLE IF NOT EXISTS public.delivery_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id TEXT REFERENCES public.shipments(id) NOT NULL,
  driver_id UUID REFERENCES auth.users(id) NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  signature_url TEXT,
  photo_url TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  notes TEXT,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Driver chat messages for AI assistant
CREATE TABLE IF NOT EXISTS public.driver_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  shipment_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add offline sync queue
CREATE TABLE IF NOT EXISTS public.offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  data JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.driver_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_sessions
CREATE POLICY "Drivers can view own sessions" ON public.driver_sessions
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Drivers can insert own sessions" ON public.driver_sessions
  FOR INSERT WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Drivers can update own sessions" ON public.driver_sessions
  FOR UPDATE USING (driver_id = auth.uid());

CREATE POLICY "Managers can view all sessions" ON public.driver_sessions
  FOR SELECT USING (has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for delivery_confirmations
CREATE POLICY "Drivers can view own confirmations" ON public.delivery_confirmations
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Drivers can create confirmations" ON public.delivery_confirmations
  FOR INSERT WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Managers can view all confirmations" ON public.delivery_confirmations
  FOR SELECT USING (has_role(auth.uid(), 'logistics_manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for driver_chat_messages
CREATE POLICY "Drivers can view own chat" ON public.driver_chat_messages
  FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Drivers can create messages" ON public.driver_chat_messages
  FOR INSERT WITH CHECK (driver_id = auth.uid());

-- RLS Policies for offline_sync_queue
CREATE POLICY "Users can manage own sync queue" ON public.offline_sync_queue
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver ON public.driver_sessions(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_shipment ON public.delivery_confirmations(shipment_id);
CREATE INDEX IF NOT EXISTS idx_driver_chat_driver_time ON public.driver_chat_messages(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offline_sync_user ON public.offline_sync_queue(user_id, synced);