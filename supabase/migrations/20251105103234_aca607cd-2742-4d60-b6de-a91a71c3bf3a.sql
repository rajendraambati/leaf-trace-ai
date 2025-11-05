-- Add aadhaar_number column to farmers table
ALTER TABLE public.farmers
ADD COLUMN aadhaar_number TEXT UNIQUE,
ADD COLUMN aadhaar_verified BOOLEAN DEFAULT false,
ADD COLUMN aadhaar_verified_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX idx_farmers_aadhaar ON public.farmers(aadhaar_number);

-- Add comment
COMMENT ON COLUMN public.farmers.aadhaar_number IS 'Aadhaar card number (12 digits)';
COMMENT ON COLUMN public.farmers.aadhaar_verified IS 'Whether Aadhaar details have been verified';
COMMENT ON COLUMN public.farmers.aadhaar_verified_at IS 'Timestamp when Aadhaar was verified';