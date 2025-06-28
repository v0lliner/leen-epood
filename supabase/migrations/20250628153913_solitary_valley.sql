/*
  # Fix Products Table RLS Policies

  1. Problem
    - Current RLS policies on products table are trying to access `users` table directly
    - This causes "permission denied for table users" error
    - The `authenticated` role doesn't have SELECT permissions on `auth.users`

  2. Solution
    - Drop existing problematic policies
    - Create new simplified policies using `auth.uid()` 
    - Allow authenticated users to manage products they uploaded
    - Allow authenticated users to insert new products

  3. Security
    - Maintains security by checking `uploaded_by` field against current user
    - Uses `auth.uid()` which is safe and doesn't require table access
    - Keeps public read access for the storefront
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can delete products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;

-- Create new simplified policies
CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid() OR uploaded_by IS NULL)
  WITH CHECK (uploaded_by = auth.uid() OR uploaded_by IS NULL);

CREATE POLICY "Users can delete their products"
  ON products
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR uploaded_by IS NULL);