-- Migration: Secure Complaint Updates
-- This migration ensures normal users cannot modify sensitive fields directly.
-- Email updates must go through secure RPCs.
-- Authorities retain full access.

-- 1. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.check_complaint_update_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If the user is an authority, allow all updates
    IF public.is_authority(auth.uid()) THEN
        RETURN NEW;
    END IF;

    -- If the update is triggered by our secure internal RPCs, allow the email tracking fields to change.
    -- The RPCs use set_config to set this flag temporarily for the transaction.
    IF current_setting('request.internal.email_rpc', true) = 'true' THEN
        -- Verify that only email fields are being modified
        IF OLD.status IS DISTINCT FROM NEW.status THEN RAISE EXCEPTION 'Not authorized to modify status'; END IF;
        IF OLD.authority_email IS DISTINCT FROM NEW.authority_email THEN RAISE EXCEPTION 'Not authorized to modify authority_email'; END IF;
        IF OLD.subject IS DISTINCT FROM NEW.subject THEN RAISE EXCEPTION 'Not authorized to modify subject'; END IF;
        IF OLD.body IS DISTINCT FROM NEW.body THEN RAISE EXCEPTION 'Not authorized to modify body'; END IF;
        IF OLD.provider IS DISTINCT FROM NEW.provider THEN RAISE EXCEPTION 'Not authorized to modify provider'; END IF;
        IF OLD.hazard_id IS DISTINCT FROM NEW.hazard_id THEN RAISE EXCEPTION 'Not authorized to modify hazard_id'; END IF;
        IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN RAISE EXCEPTION 'Not authorized to modify user_id'; END IF;
        
        -- Allow the update to proceed
        RETURN NEW;
    END IF;

    -- For any other direct user update, reject completely.
    -- (The broad UPDATE policy is being removed, but this trigger acts as defense in depth)
    RAISE EXCEPTION 'Not authorized to update complaints directly';
END;
$$;

-- 2. Drop the trigger if it exists to ensure idempotency, then create it
DROP TRIGGER IF EXISTS complaints_update_permissions_trigger ON public.complaints;

CREATE TRIGGER complaints_update_permissions_trigger
    BEFORE UPDATE ON public.complaints
    FOR EACH ROW
    EXECUTE FUNCTION public.check_complaint_update_permissions();

-- 3. Remove broad user update permissions
DROP POLICY IF EXISTS "Users can update their own complaints" ON public.complaints;
-- Only authorities need UPDATE policies. If there are others granting users broad UPDATE, they should be removed here.

-- 4. Create secure RPCs for email workflow

-- 4A. mark_complaint_email_sent
DROP FUNCTION IF EXISTS public.mark_complaint_email_sent(uuid, timestamptz);
CREATE OR REPLACE FUNCTION public.mark_complaint_email_sent(
    p_complaint_id uuid,
    p_sent_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Verify ownership
    SELECT user_id INTO v_user_id FROM public.complaints WHERE id = p_complaint_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Complaint not found';
    END IF;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Temporarily flag this transaction as an internal email RPC update
    PERFORM set_config('request.internal.email_rpc', 'true', true);

    -- Perform the narrowly scoped update
    UPDATE public.complaints
    SET 
        email_status = 'sent',
        sent_at = p_sent_at,
        error_message = NULL
    WHERE id = p_complaint_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_complaint_email_sent(uuid, timestamptz) TO authenticated;

-- 4B. mark_complaint_email_failed
DROP FUNCTION IF EXISTS public.mark_complaint_email_failed(uuid, text);
CREATE OR REPLACE FUNCTION public.mark_complaint_email_failed(
    p_complaint_id uuid,
    p_error_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Verify ownership
    SELECT user_id INTO v_user_id FROM public.complaints WHERE id = p_complaint_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Complaint not found';
    END IF;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Temporarily flag this transaction as an internal email RPC update
    PERFORM set_config('request.internal.email_rpc', 'true', true);

    -- Perform the narrowly scoped update
    UPDATE public.complaints
    SET 
        email_status = 'failed',
        error_message = left(p_error_message, 500) -- sanitize/limit error text
    WHERE id = p_complaint_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_complaint_email_failed(uuid, text) TO authenticated;
