/*
  # Storage Bucket and Policies for Product Images

  1. New Storage
    - Creates a new public storage bucket for product images

  2. Security
    - Adds appropriate RLS policies for the bucket
    - Allows public read access
    - Allows authenticated users to upload, update and delete images
*/

-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public read access to product-images bucket
CREATE POLICY "Public Access to Product Images" 
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Create policy to allow authenticated users to insert into product-images bucket
CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Create policy to allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update their own images" 
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND (auth.uid() = owner OR owner IS NULL))
WITH CHECK (bucket_id = 'product-images');

-- Create policy to allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete their own images" 
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND (auth.uid() = owner OR owner IS NULL));