/*
  # Fix public image access for production

  1. Storage Policies
    - Ensure product-images bucket allows public SELECT access
    - Allow authenticated users to manage images
  
  2. Database Policies  
    - Ensure product_images table allows public SELECT access
    - Ensure products table allows public SELECT access
    - Ensure portfolio_items table allows public SELECT access
    - Ensure about_page_content table allows public SELECT access
    - Ensure faq_items table allows public SELECT access
    - Ensure categories table allows public SELECT access

  This migration ensures that all public-facing content can be viewed by unauthenticated users.
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

-- Storage policies for product-images bucket
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from product-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;

-- Create clean, simple storage policies
CREATE POLICY "Public can view all images in product-images bucket"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload to product-images bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product-images bucket"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete from product-images bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Database table policies - ensure public can read all necessary data

-- Products table - public read access
DROP POLICY IF EXISTS "Anyone can read products" ON products;
CREATE POLICY "Public can read all products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Product images table - public read access  
DROP POLICY IF EXISTS "Anyone can read product images" ON product_images;
CREATE POLICY "Public can read all product images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

-- Portfolio items table - public read access
DROP POLICY IF EXISTS "Anyone can read portfolio items" ON portfolio_items;
CREATE POLICY "Public can read all portfolio items"
  ON portfolio_items
  FOR SELECT
  TO public
  USING (true);

-- Categories table - public read access for active categories
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Anyone can read active categories" ON categories;
CREATE POLICY "Public can read active categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

-- About page content table - public read access for active content
DROP POLICY IF EXISTS "Anyone can read about page content" ON about_page_content;
CREATE POLICY "Public can read active about page content"
  ON about_page_content
  FOR SELECT
  TO public
  USING (is_active = true);

-- FAQ items table - public read access for active items
DROP POLICY IF EXISTS "faq_public_read" ON faq_items;
CREATE POLICY "Public can read active faq items"
  ON faq_items
  FOR SELECT
  TO public
  USING (is_active = true);

-- Ensure RLS is enabled on all tables but with proper public policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to public role for reading
GRANT SELECT ON products TO anon;
GRANT SELECT ON product_images TO anon;
GRANT SELECT ON portfolio_items TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON about_page_content TO anon;
GRANT SELECT ON faq_items TO anon;

-- Grant storage permissions
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;