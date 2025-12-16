# Library Admin RLS Implementation

## Overview
Implemented role-based access control (RBAC) for the library using Supabase Auth and Row-Level Security (RLS). Only users with `role='admin'` in the `profiles` table can upload, edit, or delete books. All users have read-only access.

## Files Created/Modified

### 1. SQL Policies (`database/library_admin_rls.sql`)
- **Profiles Table**: Created with `role` column (default: 'user')
- **RLS Policies for Profiles**:
  - Users can read their own profile
  - Users can update their own profile (but not role)
  - Admins can read/update all profiles
- **RLS Policies for Books Table**:
  - Public read access (everyone can read)
  - Only admins can INSERT books
  - Only admins can UPDATE books
  - Only admins can DELETE books
- **Auto-create Profile Trigger**: Automatically creates profile when user signs up

### 2. Admin Role Service (`services/adminRoleService.js`)
- `getUserRole()`: Gets current user's role from profiles table
- `isAdmin()`: Checks if current user is admin
- `isAuthenticated()`: Checks if user has valid session

### 3. Library Page Updates (`library.html`)
- **Added Admin Role Service Import**: Loads `adminRoleService.js` as module
- **Updated `addBook()` Function**: 
  - Checks Supabase auth session
  - Verifies user role is 'admin' before allowing upload
  - Shows error if user is not admin
- **Updated `handleDeleteDocument()` Function**:
  - Checks Supabase auth session
  - Verifies user role is 'admin' before allowing deletion
  - Shows error if user is not admin
- **Added `checkAdminStatus()` Function**:
  - Async function that checks if current user is admin
  - Uses Supabase Auth session and profiles table
- **Added `updateAdminUI()` Function**:
  - Shows/hides "Add Book" button based on admin status
  - Reloads books to update delete button visibility
- **Added Auth State Listener**:
  - Listens to Supabase auth state changes
  - Updates UI when user logs in/out
- **Updated `loadBooksFromStorage()` Function**:
  - Now uses `checkAdminStatus()` instead of localStorage
  - Passes admin status to `displayBooks()` for button visibility

## Database Setup

### Step 1: Run SQL Script
Execute `database/library_admin_rls.sql` in your Supabase SQL Editor:
1. Go to Supabase Dashboard > SQL Editor
2. Paste the contents of `library_admin_rls.sql`
3. Click "Run"

### Step 2: Create First Admin User
After running the SQL script:

**Option A: Via Supabase Dashboard**
1. Go to Authentication > Users
2. Create a new user or use existing user
3. Go to Database > profiles table
4. Find the user's row (or create it if it doesn't exist)
5. Set `role` column to `'admin'`

**Option B: Via SQL**
```sql
-- Replace USER_ID_HERE with the actual UUID from auth.users
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'USER_ID_HERE';
```

## Security Features

### 1. Database-Level Enforcement (RLS)
- All write operations (INSERT, UPDATE, DELETE) are blocked at the database level for non-admins
- Even if frontend checks are bypassed, RLS policies prevent unauthorized access
- Public read access is maintained for all users

### 2. Frontend Checks
- UI elements (buttons) are hidden/shown based on admin status
- Functions check admin status before executing operations
- Clear error messages guide users

### 3. Multiple Admins Support
- Any user with `role='admin'` in profiles table has admin access
- No hardcoded user IDs or emails
- Easy to add/remove admins via database

## Usage

### For Admins
1. Login using Supabase Auth (email/password)
2. "Add Book" button appears automatically
3. Delete buttons appear on each book card
4. Can upload, edit, and delete books

### For Regular Users
1. No login required for viewing books
2. "Add Book" button is hidden
3. Delete buttons are hidden
4. Read-only access to all books

## Testing

### Test Admin Access
1. Login as admin user
2. Verify "Add Book" button is visible
3. Verify delete buttons appear on book cards
4. Try uploading a book (should succeed)
5. Try deleting a book (should succeed)

### Test User Access
1. Logout or use incognito mode
2. Verify "Add Book" button is hidden
3. Verify delete buttons are hidden
4. Try uploading a book (should show error)
5. Try deleting a book (should show error)

### Test RLS Policies
1. Try direct database query as non-admin (should fail)
2. Try direct database query as admin (should succeed)

## Troubleshooting

### "User is not admin" Error
- Check that user exists in `profiles` table
- Verify `role` column is set to `'admin'` (not `'Admin'` or `'ADMIN'`)
- Check that user is authenticated (has valid session)

### "Profile not found" Error
- Profile should be auto-created on signup
- If not, manually create profile:
  ```sql
  INSERT INTO public.profiles (id, email, role)
  VALUES ('USER_ID', 'user@example.com', 'user');
  ```

### Buttons Not Showing/Hiding
- Check browser console for errors
- Verify `checkAdminStatus()` is working
- Check that auth state listener is set up
- Refresh page after login/logout

## Notes

- **No Hardcoded Passwords**: All authentication uses Supabase Auth
- **No UI Changes**: Existing layout and styling unchanged
- **Backward Compatible**: Existing functionality preserved
- **Mobile Compatible**: Works on all devices

