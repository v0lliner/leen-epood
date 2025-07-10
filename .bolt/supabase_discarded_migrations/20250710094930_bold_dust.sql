/*
  # Fix Storage RLS Policies

  1. New Policies
    - Add public read access to product-images bucket
    - Fix RLS policies for storage.objects table
  
  2. Security
    - Enable RLS on storage.objects table
    - Add policies for authenticated and anonymous users
*/

-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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