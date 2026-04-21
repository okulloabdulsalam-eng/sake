# Storage Configuration Guide

## Architecture Overview

This application uses a **hybrid storage architecture**:

### Firebase (Auth, Firestore, FCM)
- **Authentication**: User authentication and management
- **Firestore**: Posts, metadata, links, and structured data
- **FCM**: Push notifications

### Supabase (Storage ONLY)
- **Storage**: Images, videos, audio files
- **Why Supabase?**: Better pricing, easier management, and optimized for media files

## Setup Instructions

### 1. Firebase Setup

Firebase is already configured for:
- Authentication
- Firestore (database)
- Cloud Messaging (FCM)

**No changes needed** - Firebase Storage is NOT used.

### 2. Supabase Setup

#### Step 1: Create Supabase Project
1. Go to https://app.supabase.com
2. Create a new project
3. Note your project URL and anon key

#### Step 2: Create Storage Bucket
1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `media`
3. Set bucket to **Public** (for public file access)
4. Configure CORS if needed

#### Step 3: Configure Storage Policies
In Supabase SQL Editor, run:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);
```

#### Step 4: Update Configuration
Edit `supabase-config.js`:

```javascript
window.supabaseConfig = {
    supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
    supabaseAnonKey: 'YOUR_ANON_KEY',
    storageBucket: 'media',
};
```

### 3. File Structure

```
├── supabase-config.js      # Supabase configuration
├── supabase-storage.js      # Supabase storage functions
├── fcm-config.js            # Firebase config (Auth, Firestore, FCM)
├── firebase-auth.js         # Firebase authentication
└── firebase-storage.js      # DEPRECATED - Use supabase-storage.js instead
```

## Usage

### Uploading Files

Files are uploaded directly from the client to Supabase Storage:

```javascript
// Upload to Supabase Storage
const result = await uploadToSupabaseStorage(file, 'media/images', (progress) => {
    console.log(`Upload progress: ${progress}%`);
});

if (result.success) {
    // Save metadata to database via API
    const response = await fetch('/api/upload_media.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            file_name: result.fileName,
            download_url: result.downloadURL,
            file_type: 'image',
            mime_type: file.type,
            file_size: file.size,
            storage_path: result.storagePath,
            uploaded_by: user.email
        })
    });
}
```

### Downloading Files

Files are accessed via public URLs from Supabase:

```javascript
// Get public URL
const url = getSupabaseStorageUrl('media/images/file.jpg');
```

### Deleting Files

```javascript
// Delete from Supabase Storage
await deleteFromSupabaseStorage('media/images/file.jpg');
```

## Migration Notes

- **Backward Compatibility**: The code includes aliases so `uploadToFirebaseStorage()` calls are redirected to Supabase
- **Database**: The `drive_file_id` column now stores Supabase storage paths
- **API**: The upload API now accepts JSON with Supabase URLs instead of uploading files

## Important Notes

1. **Firebase Storage SDK is removed** - Only Auth, Firestore, and FCM SDKs are loaded
2. **Supabase SDK is required** - Loaded from CDN: `@supabase/supabase-js@2`
3. **Public Bucket**: The `media` bucket must be public for file access
4. **Authentication**: File uploads require Firebase Auth (handled by Supabase policies)

## Troubleshooting

### Files not uploading
- Check Supabase bucket exists and is public
- Verify Supabase credentials in `supabase-config.js`
- Check browser console for errors

### Files not accessible
- Ensure bucket is set to public
- Check CORS settings in Supabase
- Verify storage policies are set correctly

### Authentication errors
- Ensure Firebase Auth is working
- Check Supabase storage policies allow authenticated users

