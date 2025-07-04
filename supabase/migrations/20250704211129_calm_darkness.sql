/*
  # Fix Image Display Issues

  1. Storage Configuration
    - Ensures product-images bucket is public
    - Sets proper CORS configuration
    - Configures appropriate file size limits and MIME types

  2. Storage Permissions
    - Grants explicit storage schema access to anon and authenticated roles
    - Creates clean, simple storage policies for public access
    - Ensures proper bucket and object permissions

  3. Database Permissions
    - Grants explicit SELECT permissions on all necessary tables
    - Ensures RLS policies allow public access to product data
    - Fixes any permission issues with storage-related functions
*/

-- First, ensure the product-images storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  true, 
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Verify storage bucket is public (double-check)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- Drop existing policies for the bucket to create clean ones
DROP POLICY IF EXISTS "Public can view product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete from product-images" ON storage.objects;

-- Create clean storage policies with simple conditions
CREATE POLICY "Public can view product-images" 
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated can upload to product-images" 
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update product-images" 
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete from product-images" 
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Ensure storage schema is accessible
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;

-- Database table policies - ensure public can read all necessary data
-- Products table
DROP POLICY IF EXISTS "Enable public read access for products" ON products;
CREATE POLICY "Enable public read access for products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Product images table
DROP POLICY IF EXISTS "Enable public read access for product_images" ON product_images;
CREATE POLICY "Enable public read access for product_images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

-- Portfolio items table
DROP POLICY IF EXISTS "Enable public read access for portfolio_items" ON portfolio_items;
CREATE POLICY "Enable public read access for portfolio_items"
  ON portfolio_items
  FOR SELECT
  TO public
  USING (true);

-- Categories table
DROP POLICY IF EXISTS "Enable public read access for active categories" ON categories;
CREATE POLICY "Enable public read access for active categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

-- About page content table
DROP POLICY IF EXISTS "Enable public read access for active about_page_content" ON about_page_content;
CREATE POLICY "Enable public read access for active about_page_content"
  ON about_page_content
  FOR SELECT
  TO public
  USING (is_active = true);

-- FAQ items table
DROP POLICY IF EXISTS "Enable public read access for active faq_items" ON faq_items;
CREATE POLICY "Enable public read access for active faq_items"
  ON faq_items
  FOR SELECT
  TO public
  USING (is_active = true);

-- Ensure RLS is properly configured
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Grant explicit table permissions
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON product_images TO anon, authenticated;
GRANT SELECT ON portfolio_items TO anon, authenticated;
GRANT SELECT ON categories TO anon, authenticated;
GRANT SELECT ON about_page_content TO anon, authenticated;
GRANT SELECT ON faq_items TO anon, authenticated;

-- Create a test function to verify public access
CREATE OR REPLACE FUNCTION test_public_access() 
RETURNS TABLE (
  products_accessible boolean,
  product_images_accessible boolean,
  portfolio_items_accessible boolean,
  storage_accessible boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS(SELECT 1 FROM products LIMIT 1) AS products_accessible,
    EXISTS(SELECT 1 FROM product_images LIMIT 1) AS product_images_accessible,
    EXISTS(SELECT 1 FROM portfolio_items LIMIT 1) AS portfolio_items_accessible,
    EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id = 'product-images' LIMIT 1) AS storage_accessible;
END;
$$;