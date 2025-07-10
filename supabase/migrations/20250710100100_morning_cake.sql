/*
  # Fix Storage RLS Policies

  1. New Approach
    - Use storage.buckets table instead of storage.objects for RLS
    - Create policies for the product-images bucket
    - Enable anonymous access for viewing images
    - Allow authenticated users to manage their own images

  2. Security
    - Public can only view images, not modify them
    - Authenticated users can upload, update, and delete their own images
*/

-- Create policy to allow public read access to product-images bucket
CREATE POLICY "Public Access to Product Images" 
ON storage.buckets FOR SELECT
TO public
USING (name = 'product-images');

-- Create policy to allow authenticated users to insert into product-images bucket
CREATE POLICY "Authenticated users can upload product images" 
ON storage.buckets FOR INSERT
TO authenticated
WITH CHECK (name = 'product-images');

-- Create policy to allow public to download from product-images bucket
CREATE POLICY "Public can download from product-images bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Create policy to allow authenticated users to upload to product-images bucket
CREATE POLICY "Authenticated users can upload to product-images bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Create policy to allow authenticated users to update their own objects
CREATE POLICY "Authenticated users can update their own objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND (auth.uid() = owner OR owner IS NULL));

-- Create policy to allow authenticated users to delete their own objects
CREATE POLICY "Authenticated users can delete their own objects"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND (auth.uid() = owner OR owner IS NULL));