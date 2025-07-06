/*
  # Fix storage policies for product-images bucket

  1. Storage Policies
    - Allow authenticated users to upload images to product-images bucket
    - Allow public read access to product-images
    - Allow authenticated users to delete their uploaded images

  2. Security
    - Enable RLS on storage.objects table (if not already enabled)
    - Add policies for INSERT, SELECT, and DELETE operations on product-images bucket
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload images to product-images bucket
CREATE POLICY "Authenticated users can upload to product-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Policy to allow public read access to product-images
CREATE POLICY "Public can view product-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Policy to allow authenticated users to delete from product-images bucket
CREATE POLICY "Authenticated users can delete from product-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Policy to allow authenticated users to update metadata in product-images bucket
CREATE POLICY "Authenticated users can update product-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

-- Ensure the product-images bucket exists and is public
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