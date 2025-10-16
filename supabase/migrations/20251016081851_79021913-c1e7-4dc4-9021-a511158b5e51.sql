-- Create pending_registrations table for approval workflow
CREATE TABLE public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  full_name TEXT NOT NULL,
  requested_role app_role NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  biometric_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_documents table for storing registration documents
CREATE TABLE public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.pending_registrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('identity_proof', 'certification', 'license', 'biometric')),
  document_url TEXT NOT NULL,
  document_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_registrations
CREATE POLICY "Anyone can insert pending registrations"
  ON public.pending_registrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System admins can view all pending registrations"
  ON public.pending_registrations FOR SELECT
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System admins can update pending registrations"
  ON public.pending_registrations FOR UPDATE
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for user_documents
CREATE POLICY "Anyone can insert documents during registration"
  ON public.user_documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System admins can view all documents"
  ON public.user_documents FOR SELECT
  USING (has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own documents"
  ON public.user_documents FOR SELECT
  USING (user_id = auth.uid());

-- Create storage bucket for registration documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('registration-documents', 'registration-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for registration documents
CREATE POLICY "Anyone can upload registration documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'registration-documents');

CREATE POLICY "System admins can view all registration documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'registration-documents' AND (
    has_role(auth.uid(), 'system_admin') OR has_role(auth.uid(), 'admin')
  ));

CREATE POLICY "Users can view their own registration documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'registration-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to handle registration approval
CREATE OR REPLACE FUNCTION public.approve_registration(_registration_id UUID, _admin_id UUID, _notes TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _registration RECORD;
BEGIN
  -- Check if admin has permission
  IF NOT has_role(_admin_id, 'system_admin') AND NOT has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get registration details
  SELECT * INTO _registration FROM public.pending_registrations WHERE id = _registration_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registration not found');
  END IF;

  -- Update registration status
  UPDATE public.pending_registrations
  SET status = 'approved',
      reviewed_by = _admin_id,
      reviewed_at = now(),
      admin_notes = _notes
  WHERE id = _registration_id;

  RETURN jsonb_build_object('success', true, 'registration', row_to_json(_registration));
END;
$$;

-- Function to handle registration decline
CREATE OR REPLACE FUNCTION public.decline_registration(_registration_id UUID, _admin_id UUID, _notes TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _registration RECORD;
BEGIN
  -- Check if admin has permission
  IF NOT has_role(_admin_id, 'system_admin') AND NOT has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get registration details
  SELECT * INTO _registration FROM public.pending_registrations WHERE id = _registration_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registration not found');
  END IF;

  -- Update registration status
  UPDATE public.pending_registrations
  SET status = 'declined',
      reviewed_by = _admin_id,
      reviewed_at = now(),
      admin_notes = _notes
  WHERE id = _registration_id;

  RETURN jsonb_build_object('success', true, 'registration', row_to_json(_registration));
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_pending_registrations_updated_at
  BEFORE UPDATE ON public.pending_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();