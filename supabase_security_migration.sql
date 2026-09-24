-- Security Migration: Update Hazards RLS Policies

-- Safely remove existing policies to allow clean recreation
DROP POLICY IF EXISTS "Users can view their own hazards" ON public.hazards;
DROP POLICY IF EXISTS "Authenticated users can view all hazards" ON public.hazards;
DROP POLICY IF EXISTS "Authority can update hazards" ON public.hazards;
DROP POLICY IF EXISTS "Users can insert their own hazards" ON public.hazards;

-- 1. Allow authenticated users to SELECT hazards so Map, Risk Zones, Analytics work with all hazards
CREATE POLICY "Authenticated users can view all hazards"
    ON public.hazards
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. Add authority UPDATE policy
CREATE POLICY "Authority can update hazards"
    ON public.hazards
    FOR UPDATE
    TO authenticated
    USING (public.is_authority(auth.uid()) = true)
    WITH CHECK (public.is_authority(auth.uid()) = true);

-- 4. Preserve the existing normal-user INSERT security
CREATE POLICY "Users can insert their own hazards"
    ON public.hazards
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
