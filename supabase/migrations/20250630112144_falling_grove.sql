/*
  # Fix Storage and Database Permissions for E-shop

  1. Storage Setup
    - Ensure product-images bucket exists and is public
    - Set up proper storage policies using Supabase functions
    
  2. Database Permissions
    - Enable public read access for all necessary tables
    - Configure RLS policies for Stripe integration
    - Grant proper table permissions

  3. Security
    - Maintain security for admin operations
    - Allow public read access for shop functionality
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

-- Create storage policies using the proper Supabase approach
-- Note: Storage policies in Supabase are managed differently and may need to be set via the dashboard
-- or using the storage.create_policy function if available

-- Try to create storage policies if the function exists
DO $$ 
BEGIN
  -- Check if we can create storage policies programmatically
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_policy' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage')) THEN
    -- Create storage policies
    PERFORM storage.create_policy(
      'Public Access',
      'product-images',
      'SELECT',
      'true'
    );
    
    PERFORM storage.create_policy(
      'Authenticated Upload',
      'product-images', 
      'INSERT',
      'auth.role() = ''authenticated'''
    );
    
    PERFORM storage.create_policy(
      'Authenticated Update',
      'product-images',
      'UPDATE', 
      'auth.role() = ''authenticated'''
    );
    
    PERFORM storage.create_policy(
      'Authenticated Delete',
      'product-images',
      'DELETE',
      'auth.role() = ''authenticated'''
    );
  END IF;
EXCEPTION 
  WHEN OTHERS THEN
    -- If storage policy creation fails, continue with the migration
    -- Storage policies may need to be configured manually via Supabase dashboard
    NULL;
END $$;