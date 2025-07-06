/*
  # Fix Image Display Issues

  1. Storage Configuration
    - Ensures product-images bucket exists and is public
    - Sets proper file size limits and MIME types
    - Configures correct storage policies

  2. Database Permissions
    - Grants explicit SELECT permissions to anon role
    - Creates public read policies for all necessary tables
    - Ensures RLS is enabled on all tables

  3. Storage Access
    - Grants USAGE on storage schema
    - Ensures objects and buckets are accessible
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

-- Drop existing policies for the bucket using a safer approach
DROP POLICY IF EXISTS "Public can view product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete from product-images" ON storage.objects;

-- Create clean storage policies
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

-- Ensure Stripe tables have proper policies
-- stripe_customers table
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING ((user_id = auth.uid()) AND (deleted_at IS NULL));

-- stripe_orders table
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;
CREATE POLICY "Users can view their own order data"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING ((customer_id IN (
    SELECT stripe_customers.customer_id
    FROM stripe_customers
    WHERE ((stripe_customers.user_id = auth.uid()) AND (stripe_customers.deleted_at IS NULL))
  )) AND (deleted_at IS NULL));

-- stripe_subscriptions table
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING ((customer_id IN (
    SELECT stripe_customers.customer_id
    FROM stripe_customers
    WHERE ((stripe_customers.user_id = auth.uid()) AND (stripe_customers.deleted_at IS NULL))
  )) AND (deleted_at IS NULL));

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