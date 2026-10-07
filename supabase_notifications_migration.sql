-- Migration: Notifications System
-- Creates a notifications table securely managed by triggers, without normal user insert permissions.

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    complaint_id UUID NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'complaint_status',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_complaint_id ON public.notifications(complaint_id);

-- 3. RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Select policy: Owners can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update policy: Owners can update their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Restrict Updates to only 'is_read'
CREATE OR REPLACE FUNCTION public.restrict_notification_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Prevent modification of restricted columns
    IF OLD.id IS DISTINCT FROM NEW.id THEN
        RAISE EXCEPTION 'Not authorized to modify id';
    END IF;
    
    IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
        RAISE EXCEPTION 'Not authorized to modify user_id';
    END IF;

    IF OLD.complaint_id IS DISTINCT FROM NEW.complaint_id THEN
        RAISE EXCEPTION 'Not authorized to modify complaint_id';
    END IF;

    IF OLD.title IS DISTINCT FROM NEW.title THEN
        RAISE EXCEPTION 'Not authorized to modify title';
    END IF;

    IF OLD.message IS DISTINCT FROM NEW.message THEN
        RAISE EXCEPTION 'Not authorized to modify message';
    END IF;

    IF OLD.type IS DISTINCT FROM NEW.type THEN
        RAISE EXCEPTION 'Not authorized to modify type';
    END IF;

    IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
        RAISE EXCEPTION 'Not authorized to modify created_at';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS restrict_notification_updates_trigger ON public.notifications;
CREATE TRIGGER restrict_notification_updates_trigger
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.restrict_notification_updates();

-- 5. Complaint Status Trigger
CREATE OR REPLACE FUNCTION public.handle_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_message TEXT;
BEGIN
    -- Only trigger if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Generate human readable message
        CASE NEW.status
            WHEN 'generated' THEN v_message := 'Your complaint has been generated.';
            WHEN 'sent' THEN v_message := 'Your complaint has been sent to the authority.';
            WHEN 'acknowledged' THEN v_message := 'Your complaint has been acknowledged by the authority.';
            WHEN 'in_progress' THEN v_message := 'Your complaint is now being processed.';
            WHEN 'resolved' THEN v_message := 'Your complaint has been resolved.';
            WHEN 'dismissed' THEN v_message := 'Your complaint has been dismissed.';
            ELSE v_message := 'Your complaint status has changed to ' || replace(NEW.status, '_', ' ') || '.';
        END CASE;

        -- Insert notification
        INSERT INTO public.notifications (user_id, complaint_id, title, message, type)
        VALUES (
            NEW.user_id,
            NEW.id,
            'Complaint status updated',
            v_message,
            'complaint_status'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_complaint_status_change ON public.complaints;
CREATE TRIGGER on_complaint_status_change
    AFTER UPDATE OF status ON public.complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_complaint_status_change();
