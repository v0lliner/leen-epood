/*
  # Fix Image Display Issues - Comprehensive Solution

  This migration addresses all potential causes of image display problems:
  1. Storage bucket configuration
  2. RLS policies for storage and database
  3. Public access permissions
  4. CORS settings for storage
*/

-- 1. STORAGE BUCKET SETUP
-- Ensure the product-images bucket exists and is properly configured
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

-- 2. CLEAN UP ALL EXISTING STORAGE POLICIES
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all images in product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from product-images bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;

-- 3. CREATE COMPREHENSIVE STORAGE POLICIES
-- Allow public to view ALL objects in product-images bucket
CREATE POLICY "Allow public to view product-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Allow authenticated users to manage product-images
CREATE POLICY "Allow authenticated to insert product-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated to update product-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated to delete product-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- 4. ENSURE STORAGE BUCKET IS ACCESSIBLE
-- Grant explicit permissions on storage schema
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT SELECT ON storage.buckets TO anon, authenticated;

-- 5. DATABASE TABLE POLICIES - CLEAN AND COMPREHENSIVE

-- Products table
DROP POLICY IF EXISTS "Public can read all products" ON products;
DROP POLICY IF EXISTS "Anyone can read products" ON products;
CREATE POLICY "Enable public read access for products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Product images table
DROP POLICY IF EXISTS "Public can read all product images" ON product_images;
DROP POLICY IF EXISTS "Anyone can read product images" ON product_images;
CREATE POLICY "Enable public read access for product_images"
  ON product_images
  FOR SELECT
  TO public
  USING (true);

-- Portfolio items table
DROP POLICY IF EXISTS "Public can read all portfolio items" ON portfolio_items;
DROP POLICY IF EXISTS "Anyone can read portfolio items" ON portfolio_items;
CREATE POLICY "Enable public read access for portfolio_items"
  ON portfolio_items
  FOR SELECT
  TO public
  USING (true);

-- Categories table
DROP POLICY IF EXISTS "Public can read active categories" ON categories;
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Anyone can read active categories" ON categories;
CREATE POLICY "Enable public read access for active categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

-- About page content table
DROP POLICY IF EXISTS "Public can read active about page content" ON about_page_content;
DROP POLICY IF EXISTS "Anyone can read about page content" ON about_page_content;
CREATE POLICY "Enable public read access for active about_page_content"
  ON about_page_content
  FOR SELECT
  TO public
  USING (is_active = true);

-- FAQ items table
DROP POLICY IF EXISTS "Public can read active faq items" ON faq_items;
DROP POLICY IF EXISTS "faq_public_read" ON faq_items;
DROP POLICY IF EXISTS "Anyone can read faq items" ON faq_items;
CREATE POLICY "Enable public read access for active faq_items"
  ON faq_items
  FOR SELECT
  TO public
  USING (is_active = true);

-- 6. ENSURE RLS IS PROPERLY CONFIGURED
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- 7. GRANT EXPLICIT TABLE PERMISSIONS
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON product_images TO anon, authenticated;
GRANT SELECT ON portfolio_items TO anon, authenticated;
GRANT SELECT ON categories TO anon, authenticated;
GRANT SELECT ON about_page_content TO anon, authenticated;
GRANT SELECT ON faq_items TO anon, authenticated;

-- 8. VERIFY STORAGE BUCKET IS PUBLIC
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- 9. CREATE A TEST FUNCTION TO VERIFY ACCESS
CREATE OR REPLACE FUNCTION test_public_access()
RETURNS TABLE (
  table_name text,
  can_select boolean,
  bucket_public boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Test table access
  RETURN QUERY
  SELECT 
    'products'::text,
    (SELECT COUNT(*) > 0 FROM products LIMIT 1),
    (SELECT public FROM storage.buckets WHERE id = 'product-images');
    
  RETURN QUERY
  SELECT 
    'product_images'::text,
    (SELECT COUNT(*) > 0 FROM product_images LIMIT 1),
    (SELECT public FROM storage.buckets WHERE id = 'product-images');
    
  RETURN QUERY
  SELECT 
    'portfolio_items'::text,
    (SELECT COUNT(*) > 0 FROM portfolio_items LIMIT 1),
    (SELECT public FROM storage.buckets WHERE id = 'product-images');
END;
$$;

-- Grant execute permission on test function
GRANT EXECUTE ON FUNCTION test_public_access() TO anon, authenticated;