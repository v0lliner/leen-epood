/*
  # Fix storage policies for product-images bucket

  1. Storage Bucket
    - Ensure product-images bucket exists with proper configuration
    - Set public access and file limits

  2. Storage Policies
    - Allow authenticated users to upload images
    - Allow public read access to images
    - Allow authenticated users to delete their uploaded images
    - Allow authenticated users to update image metadata

  Note: Using proper Supabase storage functions instead of direct table access
*/

-- Ensure the product-images bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product-images" ON storage.objects;

-- Create storage policies using the storage schema approach
-- Policy for uploading images (INSERT)
CREATE POLICY "Authenticated users can upload to product-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Policy for viewing images (SELECT)
CREATE POLICY "Public can view product-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Policy for deleting images (DELETE)
CREATE POLICY "Authenticated users can delete from product-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Policy for updating image metadata (UPDATE)
CREATE POLICY "Authenticated users can update product-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');