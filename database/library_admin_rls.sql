-- =====================================================
-- LIBRARY ADMIN RLS POLICIES
-- =====================================================
-- Implements role-based access control for library (books table)
-- Only users with role='admin' can upload, edit, or delete books
-- All users can read books (public access)

-- =====================================================
-- 1. CREATE PROFILES TABLE (if it doesn't exist)
-- =====================================================
-- This table stores user profiles with roles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. PROFILES TABLE RLS POLICIES
-- =====================================================

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their own role
    (OLD.role = role)
);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Admins can update any profile (including roles)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- 3. BOOKS TABLE RLS POLICIES
-- =====================================================

-- Enable RLS on books table (if not already enabled)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read books (public access)
CREATE POLICY "Public read access to books"
ON public.books
FOR SELECT
USING (true);

-- Policy: Only admins can insert books
CREATE POLICY "Only admins can insert books"
ON public.books
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Only admins can update books
CREATE POLICY "Only admins can update books"
ON public.books
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Only admins can delete books
CREATE POLICY "Only admins can delete books"
ON public.books
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- 4. HELPER FUNCTION: Get user role
-- =====================================================
-- This function can be used in policies or queries
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGER: Auto-create profile on user signup
-- =====================================================
-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (only if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================
-- Ensure authenticated users can access profiles
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;

-- =====================================================
-- 7. INITIAL ADMIN SETUP (Run this manually for first admin)
-- =====================================================
-- After creating your first admin user via Supabase Auth,
-- run this SQL to set their role (replace USER_ID with actual UUID):
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = 'USER_ID_HERE';
--
-- Or set via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Find the user
-- 3. Go to Database > profiles table
-- 4. Update the role column to 'admin'

