-- Migration: Create complaints table, constraints, and RLS policies

-- 1. Create complaints table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazard_id UUID NOT NULL REFERENCES public.hazards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    authority_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'openrouter',
    status TEXT NOT NULL DEFAULT 'generated',
    email_status TEXT NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add CHECK constraints for status and email_status
ALTER TABLE public.complaints 
    DROP CONSTRAINT IF EXISTS complaints_status_check;

ALTER TABLE public.complaints 
    ADD CONSTRAINT complaints_status_check 
    CHECK (status IN ('generated', 'sent', 'acknowledged', 'in_progress', 'resolved', 'dismissed'));

ALTER TABLE public.complaints 
    DROP CONSTRAINT IF EXISTS complaints_email_status_check;

ALTER TABLE public.complaints 
    ADD CONSTRAINT complaints_email_status_check 
    CHECK (email_status IN ('pending', 'sent', 'failed'));

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_hazard_id ON public.complaints(hazard_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at);

-- 4. Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies

-- Policy: Users can view their own complaints
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.complaints;
CREATE POLICY "Users can view their own complaints"
    ON public.complaints
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own complaints
DROP POLICY IF EXISTS "Users can update their own complaints" ON public.complaints;
CREATE POLICY "Users can update their own complaints"
    ON public.complaints
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can create complaints for their own hazards
DROP POLICY IF EXISTS "Users can create complaints for their own hazards" ON public.complaints;
CREATE POLICY "Users can create complaints for their own hazards"
    ON public.complaints
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.hazards h
            WHERE h.id = hazard_id
              AND h.user_id = auth.uid()
        )
    );

-- Policy: Authorities can view all complaints
DROP POLICY IF EXISTS "Authorities can view all complaints" ON public.complaints;
CREATE POLICY "Authorities can view all complaints"
    ON public.complaints
    FOR SELECT
    USING (public.is_authority(auth.uid()) = true);

-- Policy: Authorities can update complaints
DROP POLICY IF EXISTS "Authorities can update complaints" ON public.complaints;
CREATE POLICY "Authorities can update complaints"
    ON public.complaints
    FOR UPDATE
    USING (public.is_authority(auth.uid()) = true)
    WITH CHECK (public.is_authority(auth.uid()) = true);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_complaints_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS complaints_updated_at_trigger ON public.complaints;
CREATE TRIGGER complaints_updated_at_trigger
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.set_complaints_updated_at();
