/*
  # Fix Products Table RLS Policies for Migration

  This migration ensures that the products table has proper RLS policies
  to allow both public read access and authenticated user management.
  
  1. Security
    - Enable RLS on products table (if not already enabled)
    - Add policy for public read access to products
    - Add policy for authenticated users to manage products
    - Ensure migration scripts can access data

  2. Migration Support
    - Allow service role to bypass RLS for migration operations
    - Ensure anon role can read products for frontend display
*/

-- Enable RLS on products table (safe if already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable public read access for products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
DROP POLICY IF EXISTS "Users can read own products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update their products" ON products;
DROP POLICY IF EXISTS "Users can delete their products" ON products;

-- Create comprehensive RLS policies for products table

-- 1. Allow public (anon) users to read all available products
CREATE POLICY "Enable public read access for products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- 2. Allow authenticated users to insert new products
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. Allow users to update products they uploaded (or if uploaded_by is null for legacy products)
CREATE POLICY "Users can update their products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid() OR uploaded_by IS NULL)
  WITH CHECK (uploaded_by = auth.uid() OR uploaded_by IS NULL);

-- 4. Allow users to delete products they uploaded (or if uploaded_by is null for legacy products)
CREATE POLICY "Users can delete their products"
  ON products
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR uploaded_by IS NULL);

-- Verify the policies were created
DO $$
BEGIN
  -- Check if policies exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Enable public read access for products'
  ) THEN
    RAISE NOTICE 'SUCCESS: Public read policy created for products table';
  ELSE
    RAISE EXCEPTION 'FAILED: Public read policy was not created';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Authenticated users can insert products'
  ) THEN
    RAISE NOTICE 'SUCCESS: Authenticated insert policy created for products table';
  ELSE
    RAISE EXCEPTION 'FAILED: Authenticated insert policy was not created';
  END IF;
END $$;

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT ON products TO anon;
GRANT ALL ON products TO authenticated;

-- Ensure the service role can always access products (for migrations)
GRANT ALL ON products TO service_role;