-- Migration: V2.5 Community Feed Foundation

-- 1. Create hazard_reactions table
CREATE TABLE IF NOT EXISTS public.hazard_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazard_id UUID NOT NULL REFERENCES public.hazards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_hazard_user_reaction UNIQUE(hazard_id, user_id)
);

-- 2. Create hazard_comments table
CREATE TABLE IF NOT EXISTS public.hazard_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazard_id UUID NOT NULL REFERENCES public.hazards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_content_length CHECK (char_length(trim(content)) BETWEEN 1 AND 1000)
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_hazard_reactions_hazard_id ON public.hazard_reactions(hazard_id);
CREATE INDEX IF NOT EXISTS idx_hazard_reactions_user_id ON public.hazard_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_hazard_comments_hazard_id ON public.hazard_comments(hazard_id);
CREATE INDEX IF NOT EXISTS idx_hazard_comments_user_id ON public.hazard_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_hazard_comments_created_at ON public.hazard_comments(created_at);

-- 4. Enable RLS
ALTER TABLE public.hazard_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazard_comments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for hazard_reactions

-- SELECT: Authenticated users can read reactions
CREATE POLICY "Authenticated users can read reactions"
    ON public.hazard_reactions
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Authenticated users can insert their own reaction
CREATE POLICY "Users can insert their own reaction"
    ON public.hazard_reactions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Authenticated users can delete their own reaction
CREATE POLICY "Users can delete their own reaction"
    ON public.hazard_reactions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. RLS Policies for hazard_comments

-- SELECT: Authenticated users can read comments
CREATE POLICY "Authenticated users can read comments"
    ON public.hazard_comments
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own comment"
    ON public.hazard_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Authenticated users can update their own comments
CREATE POLICY "Users can update their own comment"
    ON public.hazard_comments
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Authenticated users can delete their own comments
CREATE POLICY "Users can delete their own comment"
    ON public.hazard_comments
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
