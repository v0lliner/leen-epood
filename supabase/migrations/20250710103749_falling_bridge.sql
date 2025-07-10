/*
  # Storage Bucket and Policies for Product Images (With Existence Checks)

  1. New Storage
    - Creates a new public storage bucket for product images (if not exists)

  2. Security
    - Adds policies for public read access (if not exists)
    - Adds policies for authenticated users to upload, update, and delete images (if not exists)
*/

-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public read access to product-images bucket (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public Access to Product Images'
    ) THEN
        CREATE POLICY "Public Access to Product Images" 
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'product-images');
    END IF;
END $$;

-- Create policy to allow authenticated users to insert into product-images bucket (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload product images'
    ) THEN
        CREATE POLICY "Authenticated users can upload product images" 
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'product-images');
    END IF;
END $$;

-- Create policy to allow authenticated users to update their own images (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can update their own images'
    ) THEN
        CREATE POLICY "Authenticated users can update their own images" 
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'product-images' AND (auth.uid() = owner OR owner IS NULL))
        WITH CHECK (bucket_id = 'product-images');
    END IF;
END $$;

-- Create policy to allow authenticated users to delete their own images (with existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can delete their own images'
    ) THEN
        CREATE POLICY "Authenticated users can delete their own images" 
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'product-images' AND (auth.uid() = owner OR owner IS NULL));
    END IF;
END $$;