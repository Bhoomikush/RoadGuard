-- Create hazards table
CREATE TABLE IF NOT EXISTS public.hazards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    image_url TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    severity TEXT,
    ai_detections JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on hazards table
ALTER TABLE public.hazards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own hazards
CREATE POLICY "Users can view their own hazards"
    ON public.hazards
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own hazards
CREATE POLICY "Users can insert their own hazards"
    ON public.hazards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for hazard images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hazard-images', 'hazard-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload images to hazard-images
CREATE POLICY "Users can upload hazard images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'hazard-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can view their own images (or public can view if public)
CREATE POLICY "Users can view hazard images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'hazard-images');
