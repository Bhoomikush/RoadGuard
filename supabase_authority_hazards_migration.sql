-- Migration: Add RLS policies for authority users on hazards table

-- 1. Add SELECT policy for authorities to view all hazards
DROP POLICY IF EXISTS "Authorities can view all hazards" ON public.hazards;
CREATE POLICY "Authorities can view all hazards"
    ON public.hazards
    FOR SELECT
    USING (public.is_authority(auth.uid()) = true);

-- 2. Add UPDATE policy for authorities to update hazards
DROP POLICY IF EXISTS "Authorities can update hazards" ON public.hazards;
CREATE POLICY "Authorities can update hazards"
    ON public.hazards
    FOR UPDATE
    USING (public.is_authority(auth.uid()) = true)
    WITH CHECK (public.is_authority(auth.uid()) = true);
