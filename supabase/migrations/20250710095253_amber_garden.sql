/*
  # Fix Storage RLS Policies

  1. Security
    - Create storage policies for product images
    - Allow public read access to product images
    - Allow authenticated users to upload, update and delete their own images
*/

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to product-images bucket
CREATE POLICY "Public Access to Product Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND (auth.uid() = owner OR owner IS NULL))
WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND (auth.uid() = owner OR owner IS NULL));