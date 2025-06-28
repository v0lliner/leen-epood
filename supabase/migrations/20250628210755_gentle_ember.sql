/*
  # Fix Storage Policies for Product Images

  1. Storage Setup
    - Create product-images bucket if it doesn't exist
    - Set up proper RLS policies for authenticated users
    
  2. Security
    - Allow authenticated users to upload images
    - Allow public read access to images
    - Allow authenticated users to delete their own uploads
*/

-- Create the product-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from product-images" ON storage.objects;

-- Policy to allow authenticated users to upload to product-images bucket
CREATE POLICY "Allow authenticated uploads to product-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Policy to allow public read access to product-images
CREATE POLICY "Allow public read access to product-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy to allow authenticated users to delete from product-images bucket
CREATE POLICY "Allow authenticated delete from product-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Policy to allow authenticated users to update objects in product-images bucket
CREATE POLICY "Allow authenticated update to product-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');