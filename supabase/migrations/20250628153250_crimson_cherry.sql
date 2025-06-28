/*
  # Media Management RLS Policies

  1. Storage Policies
    - Enable public read access to product images
    - Allow authenticated users to upload, update, and delete media
    - Proper handling of uploaded_by field for ownership tracking

  2. Products Table Updates
    - Add uploaded_by field to track who uploaded each product
    - Update RLS policies to handle media ownership
    - Ensure proper CRUD permissions for admin users

  3. Security
    - Admin users can perform all operations on any media
    - Regular users can view all media
    - Proper file type and size restrictions via storage policies
*/

-- Add uploaded_by field to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE products ADD COLUMN uploaded_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add image_path field to products table if it doesn't exist (for storage path tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_path'
  ) THEN
    ALTER TABLE products ADD COLUMN image_path text;
  END IF;
END $$;

-- Create storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their own uploads" ON storage.objects;

-- Storage policies for product images
-- 1. Anyone can view product images (public read access)
CREATE POLICY "Anyone can view product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- 2. Authenticated users can upload product images
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = 'products'
  );

-- 3. Authenticated users can update their own uploads or admins can update any
CREATE POLICY "Users can update product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email LIKE '%@admin.%'
      )
    )
  );

-- 4. Authenticated users can delete their own uploads or admins can delete any
CREATE POLICY "Users can delete product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.email LIKE '%@admin.%'
      )
    )
  );

-- Update products table RLS policies to handle uploaded_by field
DROP POLICY IF EXISTS "Anyone can read products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;

-- 1. Anyone can read available products (public access)
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- 2. Authenticated users can insert products (with uploaded_by tracking)
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() OR uploaded_by IS NULL
  );

-- 3. Authenticated users can update their own products or admins can update any
CREATE POLICY "Users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    uploaded_by IS NULL OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.%'
    )
  )
  WITH CHECK (
    uploaded_by = auth.uid() OR
    uploaded_by IS NULL OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.%'
    )
  );

-- 4. Authenticated users can delete their own products or admins can delete any
CREATE POLICY "Users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    uploaded_by IS NULL OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.%'
    )
  );

-- Create function to automatically set uploaded_by on product insert
CREATE OR REPLACE FUNCTION set_uploaded_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.uploaded_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.uploaded_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set uploaded_by
DROP TRIGGER IF EXISTS set_product_uploaded_by ON products;
CREATE TRIGGER set_product_uploaded_by
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_uploaded_by();

-- Create index for uploaded_by field for better performance
CREATE INDEX IF NOT EXISTS products_uploaded_by_idx ON products(uploaded_by);

-- Update existing products to have uploaded_by as NULL (admin ownership)
UPDATE products SET uploaded_by = NULL WHERE uploaded_by IS NULL;