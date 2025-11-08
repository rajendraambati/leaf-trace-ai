-- Create table for OTP verification
CREATE TABLE IF NOT EXISTS public.phone_otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient lookups
CREATE INDEX idx_phone_otp_phone ON public.phone_otp_verifications(phone_number);
CREATE INDEX idx_phone_otp_expires ON public.phone_otp_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.phone_otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert OTP requests (for registration)
CREATE POLICY "Anyone can request OTP" 
  ON public.phone_otp_verifications 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow verification of own OTP
CREATE POLICY "Anyone can verify OTP" 
  ON public.phone_otp_verifications 
  FOR SELECT 
  USING (true);

-- Create policy to allow update for verification
CREATE POLICY "Anyone can update OTP verification status" 
  ON public.phone_otp_verifications 
  FOR UPDATE 
  USING (true);

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.phone_otp_verifications
  WHERE expires_at < NOW() AND verified = FALSE;
END;
$$;