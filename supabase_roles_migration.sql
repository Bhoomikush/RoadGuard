-- Migration: Create user_roles table and authority function

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add CHECK constraint for allowed roles
ALTER TABLE public.user_roles 
    DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_role_check 
    CHECK (role IN ('user', 'authority'));

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Add SELECT policy allowing users to read ONLY their own role
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
CREATE POLICY "Users can read their own role"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Note: No INSERT, UPDATE, or DELETE policies are created for standard users.

-- 6. Create helper function is_authority
CREATE OR REPLACE FUNCTION public.is_authority(lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.user_roles WHERE user_id = lookup_user_id;
    RETURN COALESCE(user_role = 'authority', FALSE);
END;
$$;
