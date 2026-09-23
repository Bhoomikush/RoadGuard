-- Migration: Add status check constraint to hazards table

-- Safely remove the constraint if it already exists to make this script idempotent
ALTER TABLE public.hazards 
  DROP CONSTRAINT IF EXISTS hazards_status_check;

-- Update any potentially invalid legacy statuses (if any exist in your testing database)
-- to 'pending' to ensure the constraint can be applied successfully.
UPDATE public.hazards 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'under_review', 'in_progress', 'resolved');

-- Add the check constraint restricting the status column
ALTER TABLE public.hazards 
  ADD CONSTRAINT hazards_status_check 
  CHECK (status IN ('pending', 'under_review', 'in_progress', 'resolved'));
