-- Create storage bucket for Aadhaar documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'aadhaar-documents',
  'aadhaar-documents',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for Aadhaar documents
CREATE POLICY "Authenticated users can upload Aadhaar documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'aadhaar-documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own Aadhaar documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'aadhaar-documents' AND
  auth.role() = 'authenticated'
);

-- Add columns to farmers table
ALTER TABLE public.farmers
ADD COLUMN IF NOT EXISTS aadhaar_hash TEXT,
ADD COLUMN IF NOT EXISTS aadhaar_document_path TEXT,
ADD COLUMN IF NOT EXISTS verification_id UUID UNIQUE;

-- Create index on aadhaar_hash
CREATE INDEX IF NOT EXISTS idx_farmers_aadhaar_hash ON public.farmers(aadhaar_hash);

-- Create aadhaar_verifications table for detailed verification results
CREATE TABLE IF NOT EXISTS public.aadhaar_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID UNIQUE DEFAULT gen_random_uuid(),
  farmer_id TEXT REFERENCES public.farmers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  aadhaar_document_path TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'partially_verified', 'failed', 'pending')),
  
  -- Field comparison results
  name_status TEXT CHECK (name_status IN ('matched', 'partial_match', 'mismatch', 'not_found')),
  name_confidence INTEGER CHECK (name_confidence >= 0 AND name_confidence <= 100),
  name_extracted TEXT,
  
  aadhaar_number_status TEXT CHECK (aadhaar_number_status IN ('matched', 'partial_match', 'mismatch', 'not_found')),
  aadhaar_number_confidence INTEGER CHECK (aadhaar_number_confidence >= 0 AND aadhaar_number_confidence <= 100),
  aadhaar_number_extracted TEXT,
  
  phone_status TEXT CHECK (phone_status IN ('matched', 'partial_match', 'mismatch', 'not_found')),
  phone_confidence INTEGER CHECK (phone_confidence >= 0 AND phone_confidence <= 100),
  
  location_status TEXT CHECK (location_status IN ('matched', 'partial_match', 'mismatch', 'not_found')),
  location_confidence INTEGER CHECK (location_confidence >= 0 AND location_confidence <= 100),
  location_extracted TEXT,
  
  dob_extracted DATE,
  gender_extracted TEXT,
  address_extracted TEXT,
  
  overall_confidence INTEGER CHECK (overall_confidence >= 0 AND overall_confidence <= 100),
  remarks TEXT,
  raw_ocr_text TEXT,
  
  flagged_for_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on aadhaar_verifications
ALTER TABLE public.aadhaar_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for aadhaar_verifications
CREATE POLICY "Users can view their own verifications"
ON public.aadhaar_verifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert verifications"
ON public.aadhaar_verifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications"
ON public.aadhaar_verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update verifications"
ON public.aadhaar_verifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create verification audit logs table
CREATE TABLE IF NOT EXISTS public.aadhaar_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES public.aadhaar_verifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on verification logs
ALTER TABLE public.aadhaar_verification_logs ENABLE ROW LEVEL SECURITY;

-- Policies for verification logs
CREATE POLICY "Admins can view all verification logs"
ON public.aadhaar_verification_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert verification logs"
ON public.aadhaar_verification_logs FOR INSERT
WITH CHECK (true);

-- Function to hash Aadhaar numbers
CREATE OR REPLACE FUNCTION hash_aadhaar(aadhaar_number TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(digest(aadhaar_number, 'sha256'), 'hex');
END;
$$;

-- Trigger to automatically hash Aadhaar number
CREATE OR REPLACE FUNCTION update_farmer_aadhaar_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.aadhaar_number IS NOT NULL AND NEW.aadhaar_number != '' THEN
    NEW.aadhaar_hash := hash_aadhaar(NEW.aadhaar_number);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS farmer_aadhaar_hash_trigger ON public.farmers;
CREATE TRIGGER farmer_aadhaar_hash_trigger
BEFORE INSERT OR UPDATE ON public.farmers
FOR EACH ROW
EXECUTE FUNCTION update_farmer_aadhaar_hash();

-- Trigger to update aadhaar_verifications timestamp
CREATE OR REPLACE FUNCTION update_verification_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS verification_timestamp_trigger ON public.aadhaar_verifications;
CREATE TRIGGER verification_timestamp_trigger
BEFORE UPDATE ON public.aadhaar_verifications
FOR EACH ROW
EXECUTE FUNCTION update_verification_timestamp();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verifications_farmer_id ON public.aadhaar_verifications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON public.aadhaar_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.aadhaar_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_verifications_flagged ON public.aadhaar_verifications(flagged_for_review) WHERE flagged_for_review = true;
CREATE INDEX IF NOT EXISTS idx_verification_logs_verification_id ON public.aadhaar_verification_logs(verification_id);

COMMENT ON TABLE public.aadhaar_verifications IS 'Stores detailed Aadhaar verification results with field-level comparison';
COMMENT ON TABLE public.aadhaar_verification_logs IS 'Audit trail for all Aadhaar verification activities';
COMMENT ON COLUMN public.farmers.aadhaar_hash IS 'SHA-256 hash of Aadhaar number for secure storage';
COMMENT ON COLUMN public.farmers.verification_id IS 'Links to the detailed verification record';