/*
  # Create admin tables for CMS

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `title` (text)
      - `slug` (text, unique)
      - `description` (text)
      - `price` (text)
      - `image` (text)
      - `category` (text)
      - `subcategory` (text)
      - `dimensions` (jsonb)
      - `year` (integer)
      - `available` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `portfolio_items`
      - `id` (uuid, primary key)
      - `title` (text)
      - `technique` (text)
      - `dimensions` (text)
      - `year` (integer)
      - `category` (text)
      - `image` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage content
    - Add policies for public read access
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price text NOT NULL,
  image text,
  category text NOT NULL,
  subcategory text,
  dimensions jsonb DEFAULT '{}',
  year integer,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  technique text,
  dimensions text,
  year integer,
  category text NOT NULL,
  image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Portfolio items policies
CREATE POLICY "Anyone can read portfolio items"
  ON portfolio_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage portfolio items"
  ON portfolio_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();