/*
  # Fix Storage Permissions

  1. New Policies
    - Add public read access to product-images bucket
    - Add authenticated users' write access to product-images bucket
    
  2. Security
    - Enable RLS on storage.objects table
    - Create policies for authenticated users to manage their own images
*/

-- Create product-images bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'product-images'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('product-images', 'product-images', true);
    END IF;
END $$;

-- Enable RLS on storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to product-images bucket
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

-- Create policy to allow authenticated users to insert into product-images bucket
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

-- Create policy to allow authenticated users to update their own images
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

-- Create policy to allow authenticated users to delete their own images
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