-- Create client portal access table
CREATE TABLE IF NOT EXISTS public.client_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_type TEXT NOT NULL CHECK (client_type IN ('processing_unit', 'distributor', 'retailer', 'warehouse')),
  client_id UUID NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'read_only' CHECK (access_level IN ('read_only', 'read_write', 'admin')),
  allowed_modules TEXT[] NOT NULL DEFAULT ARRAY['orders', 'tracking', 'documents', 'invoices']::text[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  client_type TEXT NOT NULL CHECK (client_type IN ('processing_unit', 'distributor', 'retailer', 'customer')),
  client_id UUID NOT NULL,
  order_id UUID,
  shipment_id TEXT,
  batch_id TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  tax_amount NUMERIC(12, 2) DEFAULT 0,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,
  payment_method TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client notifications table
CREATE TABLE IF NOT EXISTS public.client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_type TEXT NOT NULL,
  client_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('order_update', 'shipment_update', 'document_ready', 'invoice_generated', 'payment_reminder', 'compliance_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT false,
  related_entity_type TEXT,
  related_entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_portal_access
CREATE POLICY "Users can view their own portal access"
ON public.client_portal_access
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage portal access"
ON public.client_portal_access
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices for their clients"
ON public.invoices
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.client_portal_access cpa
    WHERE cpa.user_id = auth.uid()
      AND cpa.client_type = invoices.client_type
      AND cpa.client_id = invoices.client_id
      AND cpa.is_active = true
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage invoices"
ON public.invoices
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- RLS Policies for client_notifications
CREATE POLICY "Users can view their own notifications"
ON public.client_notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.client_notifications
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.client_notifications
FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_portal_access_user_id ON public.client_portal_access(user_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_access_client ON public.client_portal_access(client_type, client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_type, client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_client_notifications_user_id ON public.client_notifications(user_id, is_read);

-- Create update trigger functions
CREATE OR REPLACE FUNCTION public.update_client_portal_access_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_invoices_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER update_client_portal_access_updated_at
BEFORE UPDATE ON public.client_portal_access
FOR EACH ROW
EXECUTE FUNCTION public.update_client_portal_access_updated_at();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_invoices_updated_at();

-- Enable realtime for client notifications
ALTER TABLE public.client_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_notifications;