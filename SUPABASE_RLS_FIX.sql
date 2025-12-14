-- ============================================
-- Fix Supabase Storage RLS Policies
-- ============================================
-- This allows public uploads, reads, and deletes
-- Security is handled by client-side password (kiuma2025)
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;

-- Allow public read access (for downloading/viewing files)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow public uploads (since we have password protection on client side)
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media');

-- Allow public delete (since we have password protection on client side)
CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'media');

