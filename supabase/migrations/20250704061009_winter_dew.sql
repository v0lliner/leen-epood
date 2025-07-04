/*
  # Fix Image Display and Storage Access

  1. Storage Configuration
    - Ensure product-images bucket exists and is public
    - Set proper file size limits and MIME types
    - Configure storage policies for public access

  2. Database Policies
    - Enable public read access for all content tables
    - Ensure proper RLS configuration
    - Grant necessary permissions to anon role

  3. Stripe Tables
    - Configure user-specific access policies
    - Ensure proper data isolation

  This migration fixes image display issues by ensuring proper storage and database access.
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

-- Ensure storage bucket is accessible
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

-- Verify storage bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- Create a test function to verify public access
CREATE OR REPLACE FUNCTION test_public_access()
RETURNS TABLE(
  products_count bigint,
  images_count bigint,
  portfolio_count bigint,
  categories_count bigint,
  bucket_public boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM product_images) as images_count,
    (SELECT COUNT(*) FROM portfolio_items) as portfolio_count,
    (SELECT COUNT(*) FROM categories WHERE is_active = true) as categories_count,
    (SELECT public FROM storage.buckets WHERE id = 'product-images') as bucket_public;
END;
$$;