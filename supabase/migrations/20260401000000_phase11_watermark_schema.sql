-- Migration: Phase 11 - Upload & Watermark Infrastructure
-- Description: Adds watermark paths and tracking to photos table.

-- 1. Add watermark columns to app_carsena.photos
ALTER TABLE app_carsena.photos 
ADD COLUMN IF NOT EXISTS watermark_path text,
ADD COLUMN IF NOT EXISTS is_processed boolean DEFAULT false;

-- 2. Ensure Storage bucket 'fotografia' is not public if needed (currently it is public, let's keep it but restrict access via RLS)
-- We will manage access via RLS for the 'fotografia' bucket.

-- Note: In Supabase Self-Hosted, Storage RLS is handled on the storage.objects table.
-- We need to ensure that:
-- 1. Admins can do everything.
-- 2. Authenticated users (customers) can only read 'watermarked/' and 'thumbnails/' if they have access to the gallery.
-- 3. Anonymous users (if allowed) can only see watermarked versions.

-- Policy for ADMINS (Full Access)
DROP POLICY IF EXISTS "Admins have full access to fotografia bucket" ON storage.objects;
CREATE POLICY "Admins have full access to fotografia bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'fotografia' AND 
    (SELECT role FROM app_carsena.customers WHERE email = auth.email()) = 'admin'
);

-- Policy for CLIENTS (Access to Watermarked version of their gallery)
DROP POLICY IF EXISTS "Clients can view watermarked photos from their gallery" ON storage.objects;
CREATE POLICY "Clients can view watermarked photos from their gallery"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'fotografia' AND 
    (name LIKE 'watermarked/%' OR name LIKE 'thumbnails/%') AND
    EXISTS (
        SELECT 1 FROM app_carsena.photos p
        JOIN app_carsena.galleries g ON p.gallery_id = g.id
        WHERE p.watermark_path = name AND g.customer_id = (SELECT id FROM app_carsena.customers WHERE email = auth.email())
    )
);

-- Policy for PUBLIC (Access to Watermarked version of PUBLIC galleries)
-- If a gallery is not private, anyone can see watermarked versions.
DROP POLICY IF EXISTS "Public can view watermarked photos of public galleries" ON storage.objects;
CREATE POLICY "Public can view watermarked photos of public galleries"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'fotografia' AND 
    (name LIKE 'watermarked/%' OR name LIKE 'thumbnails/%') AND
    EXISTS (
        SELECT 1 FROM app_carsena.photos p
        JOIN app_carsena.galleries g ON p.gallery_id = g.id
        WHERE p.watermark_path = name AND g.is_private = false
    )
);
