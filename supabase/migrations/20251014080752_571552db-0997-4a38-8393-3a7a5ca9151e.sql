-- Drop the foreign key constraint on ai_gradings.batch_id
ALTER TABLE public.ai_gradings 
DROP CONSTRAINT IF EXISTS ai_gradings_batch_id_fkey;

-- Make batch_id nullable so it's optional
ALTER TABLE public.ai_gradings 
ALTER COLUMN batch_id DROP NOT NULL;