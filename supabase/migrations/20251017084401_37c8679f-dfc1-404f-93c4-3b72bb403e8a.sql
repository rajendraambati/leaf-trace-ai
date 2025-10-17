-- First, clean up orphaned records before making schema changes
DELETE FROM public.procurement_batches 
WHERE farmer_id NOT IN (SELECT id FROM public.farmers);

DELETE FROM public.farmer_documents 
WHERE farmer_id NOT IN (SELECT id FROM public.farmers);

DELETE FROM public.farmer_certifications 
WHERE farmer_id NOT IN (SELECT id FROM public.farmers);

-- Drop existing foreign key constraints explicitly
ALTER TABLE IF EXISTS public.procurement_batches DROP CONSTRAINT IF EXISTS procurement_batches_farmer_id_fkey;
ALTER TABLE IF EXISTS public.procurement_batches DROP CONSTRAINT IF EXISTS fk_procurement_batches_farmer;
ALTER TABLE IF EXISTS public.farmer_documents DROP CONSTRAINT IF EXISTS farmer_documents_farmer_id_fkey;
ALTER TABLE IF EXISTS public.farmer_documents DROP CONSTRAINT IF EXISTS fk_farmer_documents_farmer;
ALTER TABLE IF EXISTS public.farmer_certifications DROP CONSTRAINT IF EXISTS farmer_certifications_farmer_id_fkey;
ALTER TABLE IF EXISTS public.farmer_certifications DROP CONSTRAINT IF EXISTS fk_farmer_certifications_farmer;

-- Create a temporary column for new IDs in farmers table
ALTER TABLE public.farmers ADD COLUMN new_id TEXT;

-- Generate 8-character IDs for existing farmers
UPDATE public.farmers 
SET new_id = UPPER(SUBSTRING(MD5(id::TEXT || created_at::TEXT), 1, 8));

-- Create temporary columns in related tables
ALTER TABLE public.procurement_batches ADD COLUMN new_farmer_id TEXT;
ALTER TABLE public.farmer_documents ADD COLUMN new_farmer_id TEXT;
ALTER TABLE public.farmer_certifications ADD COLUMN new_farmer_id TEXT;

-- Update related tables with new IDs based on mapping from old farmers.id
UPDATE public.procurement_batches pb
SET new_farmer_id = f.new_id
FROM public.farmers f
WHERE pb.farmer_id = f.id::TEXT;

UPDATE public.farmer_documents fd
SET new_farmer_id = f.new_id
FROM public.farmers f
WHERE fd.farmer_id = f.id::TEXT;

UPDATE public.farmer_certifications fc
SET new_farmer_id = f.new_id
FROM public.farmers f
WHERE fc.farmer_id = f.id::TEXT;

-- Drop old primary key and id column from farmers
ALTER TABLE public.farmers DROP CONSTRAINT farmers_pkey CASCADE;
ALTER TABLE public.farmers DROP COLUMN id;
ALTER TABLE public.farmers RENAME COLUMN new_id TO id;
ALTER TABLE public.farmers ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.farmers ADD PRIMARY KEY (id);

-- Add CHECK constraint to ensure ID is exactly 8 characters
ALTER TABLE public.farmers ADD CONSTRAINT farmers_id_length_check CHECK (LENGTH(id) = 8);

-- Drop old farmer_id columns and rename new ones in related tables
ALTER TABLE public.procurement_batches DROP COLUMN farmer_id;
ALTER TABLE public.procurement_batches RENAME COLUMN new_farmer_id TO farmer_id;
ALTER TABLE public.procurement_batches ALTER COLUMN farmer_id SET NOT NULL;

ALTER TABLE public.farmer_documents DROP COLUMN farmer_id;
ALTER TABLE public.farmer_documents RENAME COLUMN new_farmer_id TO farmer_id;
ALTER TABLE public.farmer_documents ALTER COLUMN farmer_id SET NOT NULL;

ALTER TABLE public.farmer_certifications DROP COLUMN farmer_id;
ALTER TABLE public.farmer_certifications RENAME COLUMN new_farmer_id TO farmer_id;
ALTER TABLE public.farmer_certifications ALTER COLUMN farmer_id SET NOT NULL;

-- Recreate foreign key constraints
ALTER TABLE public.procurement_batches 
ADD CONSTRAINT procurement_batches_farmer_id_fkey 
FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE CASCADE;

ALTER TABLE public.farmer_documents 
ADD CONSTRAINT farmer_documents_farmer_id_fkey 
FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE CASCADE;

ALTER TABLE public.farmer_certifications 
ADD CONSTRAINT farmer_certifications_farmer_id_fkey 
FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE CASCADE;