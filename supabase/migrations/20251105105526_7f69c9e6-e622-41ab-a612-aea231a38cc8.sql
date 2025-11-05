-- Fix security warnings by setting search_path on newly created functions

CREATE OR REPLACE FUNCTION hash_aadhaar(aadhaar_number TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(aadhaar_number, 'sha256'), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION update_farmer_aadhaar_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.aadhaar_number IS NOT NULL AND NEW.aadhaar_number != '' THEN
    NEW.aadhaar_hash := hash_aadhaar(NEW.aadhaar_number);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_verification_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;