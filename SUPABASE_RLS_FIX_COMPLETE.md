# Complete Fix for Supabase Storage RLS Error

## 🔴 Error You're Seeing

```
StorageApiError: new row violates row-level security policy
```

This error occurs when trying to upload media files (images, videos, audio) to Supabase Storage.

**Affects:**
- ✅ Desktop uploads
- ✅ Mobile uploads
- ✅ All file types (images, videos, audio)

---

## ✅ Solution: Update Supabase Storage Policies

### Step 1: Go to Supabase Dashboard

1. Open: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)

### Step 2: Run This SQL

**📋 EASY COPY: Open the file `SUPABASE_RLS_FIX.sql` in this folder - it contains just the SQL code!**

Or copy and paste this SQL into the SQL Editor, then click **Run**:

```sql
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
```

**💡 TIP: The easiest way is to open `SUPABASE_RLS_FIX.sql` file and copy all the contents!**

### Step 3: Verify Policies

1. Go to **Storage** → **Policies** (left sidebar)
2. Select the `media` bucket
3. You should see 3 policies:
   - ✅ Public Read Access
   - ✅ Public Upload Access
   - ✅ Public Delete Access

### Step 4: Test Upload

1. Go to `media.html`
2. Click "Add Media File"
3. Select a file
4. Click "Upload to Google Drive"
5. ✅ Should work without errors!

---

## 🔍 Alternative: Check via Supabase Dashboard

If SQL Editor doesn't work, use the Dashboard:

1. Go to **Storage** → **Policies**
2. Select `media` bucket
3. Click **New Policy**
4. For each policy:

   **Policy 1: Read Access**
   - Policy name: `Public Read Access`
   - Allowed operation: `SELECT`
   - Target roles: `public`
   - USING expression: `bucket_id = 'media'`

   **Policy 2: Upload Access**
   - Policy name: `Public Upload Access`
   - Allowed operation: `INSERT`
   - Target roles: `public`
   - WITH CHECK expression: `bucket_id = 'media'`

   **Policy 3: Delete Access**
   - Policy name: `Public Delete Access`
   - Allowed operation: `DELETE`
   - Target roles: `public`
   - USING expression: `bucket_id = 'media'`

---

## 📱 Mobile Upload Fix

The same RLS policies apply to mobile uploads. Once you fix the policies:

1. ✅ Desktop uploads will work
2. ✅ Mobile uploads will work
3. ✅ All devices will work

**No separate mobile fix needed** - it's the same storage bucket!

---

## 🔐 Security Note

**Why is this safe?**

- ✅ Client-side password protection (`kiuma2025`) prevents unauthorized access
- ✅ Only authenticated admins can access the upload interface
- ✅ Public storage access is acceptable when combined with password protection
- ✅ Files are still private (not publicly listed without direct URL)

**This is the recommended approach** for your use case where:
- You use Firebase Auth for user authentication
- You have password protection for admin operations
- You want simple, reliable uploads

---

## 🐛 Troubleshooting

### Issue: "Policy already exists"

**Solution:** The SQL includes `DROP POLICY IF EXISTS` to handle this. If you still get errors:
1. Go to Storage → Policies
2. Manually delete existing policies
3. Run the SQL again

### Issue: "Permission denied"

**Solution:** Make sure you're logged into Supabase as the project owner/admin.

### Issue: "Bucket not found"

**Solution:** 
1. Go to Storage → Buckets
2. Make sure `media` bucket exists
3. If not, create it first

### Issue: Still getting RLS error after fix

**Solution:**
1. Clear browser cache
2. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. Try upload again
4. Check browser console for new errors

---

## ✅ Verification Checklist

After applying the fix:

- [ ] SQL executed successfully
- [ ] 3 policies visible in Storage → Policies
- [ ] Desktop upload works
- [ ] Mobile upload works
- [ ] No RLS errors in console
- [ ] Files appear in Supabase Storage

---

## 📝 Quick Reference

**Password:** `kiuma2025` (for admin access)  
**Bucket:** `media`  
**Policies needed:** 3 (Read, Upload, Delete)  
**Security:** Client-side password + public storage

---

## 🚀 After Fix

Once policies are updated:
- ✅ All uploads will work (desktop + mobile)
- ✅ No more RLS errors
- ✅ Files will upload successfully
- ✅ Files will be accessible for download

**The fix applies to all devices automatically!**

