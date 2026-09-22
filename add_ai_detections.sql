-- Migration to add ai_detections to hazards table
ALTER TABLE public.hazards
ADD COLUMN IF NOT EXISTS ai_detections JSONB;
