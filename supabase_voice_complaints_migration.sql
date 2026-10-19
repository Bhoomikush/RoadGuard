-- Migration: Voice Complaint Reporting Support
-- Makes hazard_id optional, adds voice complaint metadata columns, creates complaint-evidence bucket, and updates RLS.

-- 1. Make hazard_id nullable in complaints table to allow standalone or companion complaints
ALTER TABLE public.complaints ALTER COLUMN hazard_id DROP NOT NULL;

-- 2. Add columns for voice complaint details, geocoding, and authority channels
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS authority_name TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email';
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS evidence_storage_path TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS evidence_url TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS provider_ref_id TEXT;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS suggested_authority TEXT;

-- 3. Update status CHECK constraints
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE public.complaints ADD CONSTRAINT complaints_status_check 
    CHECK (status IN ('draft', 'generated', 'sent', 'submitted_externally', 'failed', 'acknowledged', 'in_progress', 'resolved', 'dismissed'));

ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_email_status_check;
ALTER TABLE public.complaints ADD CONSTRAINT complaints_email_status_check 
    CHECK (email_status IN ('pending', 'sent', 'failed', 'not_applicable'));

-- 4. Update Complaints INSERT policy to allow voice complaints created by the authenticated user
DROP POLICY IF EXISTS "Users can create complaints for their own hazards" ON public.complaints;
DROP POLICY IF EXISTS "Users can create complaints" ON public.complaints;

CREATE POLICY "Users can create complaints"
    ON public.complaints
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Ensure users can view their own complaints and authorities can view all
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.complaints;
CREATE POLICY "Users can view their own complaints"
    ON public.complaints
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. Create private storage bucket for complaint evidence (video and audio recordings)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('complaint-evidence', 'complaint-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Policies for complaint-evidence
DROP POLICY IF EXISTS "Users can upload complaint evidence" ON storage.objects;
CREATE POLICY "Users can upload complaint evidence"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'complaint-evidence' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can view their own complaint evidence" ON storage.objects;
CREATE POLICY "Users can view their own complaint evidence"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'complaint-evidence' 
        AND (
            auth.uid()::text = (storage.foldername(name))[1] 
            OR public.is_authority(auth.uid()) = true
        )
    );
