-- Storage Security Migration: Add DELETE Policy for Hazard Images

DROP POLICY IF EXISTS "Users can delete their own hazard images" ON storage.objects;

CREATE POLICY "Users can delete their own hazard images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'hazard-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
