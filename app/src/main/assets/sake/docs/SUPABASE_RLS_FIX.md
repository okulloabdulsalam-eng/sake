# Fix Supabase Storage RLS Policy Error

## Problem
You're seeing this error when uploading media:
```
StorageApiError: new row violates row-level security policy
```

This happens because Supabase Storage has Row Level Security (RLS) enabled, and the current policies don't allow anonymous uploads.

## Solution: Update Storage Policies

You need to update the RLS policies in your Supabase dashboard to allow uploads. Here are two options:

### Option 1: Allow Public Uploads (Recommended for this use case)

Since you're already using password protection (`kiuma2025`) on the client side, you can allow public uploads to the storage bucket.

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Storage** → **Policies**
4. Select the `media` bucket
5. Click **New Policy** or edit existing policies

Run this SQL in the Supabase SQL Editor:

```sql
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
```

### Option 2: Allow Authenticated Uploads Only

If you want stricter security, you can require Supabase authentication:

```sql
-- Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);
```

**Note:** Option 2 requires users to be authenticated with Supabase Auth, which you're not currently using (you're using Firebase Auth).

## Recommended: Option 1

Since you're using:
- Firebase Auth for user authentication
- Password protection (`kiuma2025`) for admin operations
- Client-side validation

**Option 1 (Public Uploads)** is the recommended approach. The password protection on the client side provides sufficient security for your use case.

## Steps to Apply

1. Open Supabase Dashboard → SQL Editor
2. Paste the SQL from Option 1 above
3. Click **Run**
4. Try uploading a file again

## Verify Policies

After applying, you can verify the policies:
1. Go to Storage → Policies
2. Select the `media` bucket
3. You should see the three policies listed

## Alternative: Disable RLS (Not Recommended)

If you want to disable RLS entirely (less secure):

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Warning:** This disables all security policies. Only do this if you're certain about the security implications.

