-- Create storage bucket for tobacco leaf images
INSERT INTO storage.buckets (id, name, public)
VALUES ('tobacco-images', 'tobacco-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for tobacco images bucket
CREATE POLICY "Anyone can view tobacco images"
ON storage.objects FOR SELECT
USING (bucket_id = 'tobacco-images');

CREATE POLICY "Authenticated users can upload tobacco images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tobacco-images' 
  AND auth.role() = 'authenticated'
);