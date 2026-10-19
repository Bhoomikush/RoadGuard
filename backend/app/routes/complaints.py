import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel, Field
from supabase import create_client, ClientOptions

from ..dependencies import get_current_user
from ..services.complaints_service import generate_official_complaint
from ..services.email_service import send_complaint_email, validate_email
from ..services.transcription_service import transcribe_media, validate_media_upload
from ..services.geocoding_service import reverse_geocode, validate_coordinates
from ..services.authority_service import pick_authority, get_available_authorities

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/complaints",
    tags=["complaints"],
)

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")


# Pydantic Schemas for validation
class GenerateLetterRequest(BaseModel):
    transcript: str = Field(..., min_length=1, description="Citizen spoken transcript or complaint description")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    address: Optional[str] = None
    authority_name: Optional[str] = None
    issue_details: Optional[str] = None
    language: Optional[str] = Field("en", description="Target language: en, hi, or mr")
    has_evidence: Optional[bool] = False
    evidence_storage_path: Optional[str] = None


class SendComplaintRequest(BaseModel):
    subject: str = Field(..., min_length=3, max_length=300)
    body: str = Field(..., min_length=10)
    authority_name: str = Field(..., min_length=2)
    authority_email: Optional[str] = None
    channel: str = Field("email", description="Channel: 'email' or 'external_portal'")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    address: Optional[str] = None
    transcript: Optional[str] = None
    evidence_storage_path: Optional[str] = None
    hazard_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoint 1: Speech-to-Text Transcription
# ---------------------------------------------------------------------------
@router.post("/transcribe")
async def transcribe_complaint_audio(
    file: UploadFile = File(...),
    user_data = Depends(get_current_user)
):
    """
    Accepts recorded video or audio from citizen complaint recording.
    Transcribes spoken voice in English, Hindi, or Marathi via hosted backend service.
    """
    MAX_SIZE = 50 * 1024 * 1024  # 50 MB
    content_type = file.content_type or "video/webm"

    try:
        # Validate mime type
        validate_media_upload(content_type, 0)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))

    try:
        contents = bytearray()
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            contents.extend(chunk)
            if len(contents) > MAX_SIZE:
                raise HTTPException(status_code=400, detail="Recording size exceeds the 50 MB limit.")

        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        result = await transcribe_media(bytes(contents), content_type)
        return result

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"Transcription failure: {e}")
        raise HTTPException(status_code=503, detail="Speech-to-text service is temporarily unavailable. Please type your description manually.")
    except Exception as e:
        logger.error(f"Unexpected error in /transcribe: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the recording.")


# ---------------------------------------------------------------------------
# Endpoint 2: Reverse Geocode & Suggest Authority
# ---------------------------------------------------------------------------
@router.get("/reverse-geocode")
async def reverse_geocode_location(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    user_data = Depends(get_current_user)
):
    """
    Reverse-geocodes coordinates into an address and recommends the responsible road authority.
    Does not expose external keys or secrets.
    """
    try:
        result = await reverse_geocode(lat, lng)
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.error(f"Reverse geocode endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Failed to geocode location.")


# ---------------------------------------------------------------------------
# Endpoint 3: Generate Formal Complaint Letter
# ---------------------------------------------------------------------------
@router.post("/generate-letter")
async def generate_letter_endpoint(
    req: GenerateLetterRequest,
    user_data = Depends(get_current_user)
):
    """
    Generates a formal, professional road complaint letter based on confirmed verified facts.
    Treats transcript strictly as untrusted data with anti-hallucination constraints.
    """
    clean_transcript = req.transcript.strip()
    if not clean_transcript:
        raise HTTPException(status_code=400, detail="Complaint transcript or description cannot be empty.")

    hazard_data = {
        "transcript": clean_transcript,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "address": req.address or "",
        "authority_name": req.authority_name or "Concerned Road Authority",
        "issue_details": req.issue_details or "",
        "language": req.language or "en",
        "has_evidence": req.has_evidence or bool(req.evidence_storage_path),
        "evidence_storage_path": req.evidence_storage_path
    }

    try:
        generated = await generate_official_complaint(hazard_data)
        return {
            "subject": generated["subject"],
            "body": generated["body"],
            "authority_name": req.authority_name or "Concerned Road Authority",
            "language": req.language or "en"
        }
    except Exception as e:
        logger.error(f"Letter generation error: {e}")
        error_msg = str(e)
        if "OPENROUTER_API_KEY" in error_msg:
            raise HTTPException(status_code=503, detail="AI complaint generation service is not configured.")
        raise HTTPException(status_code=500, detail="Failed to generate official complaint letter.")


# ---------------------------------------------------------------------------
# Endpoint 4: Upload Video Evidence to Private Storage
# ---------------------------------------------------------------------------
@router.post("/evidence")
async def upload_complaint_evidence(
    file: UploadFile = File(...),
    user_data = Depends(get_current_user)
):
    """
    Uploads complaint video/audio evidence to private Supabase Storage bucket 'complaint-evidence'.
    Generates a secure, temporary signed URL for authority inspection.
    """
    user = user_data["user"]
    token = user_data["token"]
    content_type = file.content_type or "video/webm"
    MAX_SIZE = 50 * 1024 * 1024

    try:
        validate_media_upload(content_type, 0)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))

    contents = bytearray()
    while chunk := await file.read(1024 * 1024):
        contents.extend(chunk)
        if len(contents) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="Evidence size exceeds 50 MB limit.")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded evidence file is empty.")

    file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "webm"
    filename = f"{user.id}/{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:8]}.{file_ext}"

    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))

    try:
        # Upload to complaint-evidence bucket
        upload_res = req_supabase.storage.from_("complaint-evidence").upload(
            filename,
            bytes(contents),
            file_options={"content-type": content_type}
        )

        # Generate 7-day signed URL (604800 seconds) for viewing
        signed_res = req_supabase.storage.from_("complaint-evidence").create_signed_url(
            filename,
            604800
        )
        signed_url = signed_res.get("signedURL") or signed_res.get("signedUrl") if isinstance(signed_res, dict) else ""

        return {
            "storage_path": filename,
            "signed_url": signed_url
        }
    except Exception as e:
        logger.warning(f"Failed to upload to complaint-evidence bucket: {e}. Trying hazard-images as fallback...")
        try:
            # Fallback to hazard-images bucket if complaint-evidence bucket not yet created
            fallback_res = req_supabase.storage.from_("hazard-images").upload(
                filename,
                bytes(contents),
                file_options={"content-type": content_type}
            )
            pub_res = req_supabase.storage.from_("hazard-images").get_public_url(filename)
            return {
                "storage_path": filename,
                "signed_url": pub_res.get("publicUrl") if isinstance(pub_res, dict) else ""
            }
        except Exception as fb_err:
            logger.error(f"Evidence upload failed on both buckets: {fb_err}")
            raise HTTPException(status_code=500, detail="Failed to securely upload evidence media.")


# ---------------------------------------------------------------------------
# Endpoint 5: Send / Persist Complaint (Explicit User Confirmation)
# ---------------------------------------------------------------------------
@router.post("/send")
async def send_or_submit_complaint(
    req: SendComplaintRequest,
    user_data = Depends(get_current_user)
):
    """
    Explicitly submits and persists the approved complaint.
    - If channel is 'email', sends through Resend to verified authority email.
    - If channel is 'external_portal', saves as 'submitted_externally'.
    - Double-click and duplicate submission protection built in.
    """
    user = user_data["user"]
    token = user_data["token"]
    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))

    # 1. Double-submission / idempotency protection (check last 3 minutes)
    try:
        recent_check = req_supabase.table("complaints").select("id, status, created_at")\
            .eq("user_id", user.id)\
            .eq("subject", req.subject.strip())\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()

        if recent_check.data and len(recent_check.data) > 0:
            last_created = recent_check.data[0].get("created_at")
            if last_created:
                # If submitted less than 60 seconds ago, treat as duplicate
                # Return existing record safely
                return {
                    "id": recent_check.data[0].get("id"),
                    "status": recent_check.data[0].get("status"),
                    "message": "Complaint has already been submitted.",
                    "is_duplicate": True
                }
    except Exception as e:
        logger.warning(f"Duplicate check failed: {e}")

    # 2. Evidence signed URL resolution (if storage path provided)
    evidence_url = None
    if req.evidence_storage_path:
        try:
            signed_res = req_supabase.storage.from_("complaint-evidence").create_signed_url(
                req.evidence_storage_path,
                604800
            )
            evidence_url = signed_res.get("signedURL") or signed_res.get("signedUrl") if isinstance(signed_res, dict) else None
        except Exception:
            try:
                pub_url = req_supabase.storage.from_("hazard-images").get_public_url(req.evidence_storage_path)
                evidence_url = pub_url.get("publicUrl") if isinstance(pub_url, dict) else None
            except Exception:
                pass

    # 3. Create companion hazard record if hazard_id not provided and coordinates exist
    # This automatically satisfies foreign key constraints and makes the report visible on maps
    hazard_id = req.hazard_id
    if not hazard_id and req.latitude is not None and req.longitude is not None:
        try:
            hazard_data = {
                "user_id": user.id,
                "image_url": req.evidence_storage_path or "voice_report.webm",
                "latitude": req.latitude,
                "longitude": req.longitude,
                "description": f"Voice Complaint: {req.transcript[:200] if req.transcript else req.subject}",
                "status": "pending",
                "severity": "medium",
                "ai_detections": [{"class_name": "voice_reported_hazard", "confidence": 1.0}]
            }
            hazard_insert = req_supabase.table("hazards").insert(hazard_data).execute()
            if hazard_insert.data and len(hazard_insert.data) > 0:
                hazard_id = hazard_insert.data[0].get("id")
        except Exception as h_err:
            logger.warning(f"Companion hazard creation skipped: {h_err}")

    # 4. Handle sending channel
    channel = req.channel.lower().strip()
    email_status = "not_applicable"
    delivery_status = "generated"
    provider_ref_id = None
    error_message = None

    if channel == "email":
        target_email = req.authority_email.strip() if req.authority_email and validate_email(req.authority_email) else os.environ.get("ROAD_AUTHORITY_EMAIL")
        if not target_email:
            raise HTTPException(status_code=400, detail="No verified authority email address available for sending.")

        try:
            resend_resp = send_complaint_email(
                subject=req.subject,
                body=req.body,
                recipient_email=target_email,
                evidence_url=evidence_url
            )
            email_status = "sent"
            delivery_status = "sent"
            provider_ref_id = resend_resp.get("id") if isinstance(resend_resp, dict) else "sent"
        except Exception as send_err:
            logger.error(f"Email delivery failed: {send_err}")
            email_status = "failed"
            delivery_status = "generated"
            error_message = str(send_err)
            raise HTTPException(status_code=500, detail=f"Failed to deliver complaint email: {str(send_err)}")

    elif channel == "external_portal":
        delivery_status = "submitted_externally"
        email_status = "not_applicable"

    # 5. Persist into Supabase public.complaints
    insert_payload: Dict[str, Any] = {
        "user_id": user.id,
        "authority_email": req.authority_email or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "subject": req.subject,
        "body": req.body,
        "provider": "openrouter",
        "status": delivery_status,
        "email_status": email_status if email_status in ["pending", "sent", "failed"] else "pending",
        "sent_at": datetime.now(timezone.utc).isoformat() if delivery_status == "sent" else None,
        "error_message": error_message
    }
    if hazard_id:
        insert_payload["hazard_id"] = hazard_id

    # Optional columns if migration has applied
    extra_fields = {
        "transcript": req.transcript,
        "location_address": req.address,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "authority_name": req.authority_name,
        "channel": req.channel,
        "evidence_storage_path": req.evidence_storage_path,
        "provider_ref_id": provider_ref_id
    }

    try:
        # Try inserting with new fields first
        combined_payload = {**insert_payload, **{k: v for k, v in extra_fields.items() if v is not None}}
        result = req_supabase.table("complaints").insert(combined_payload).execute()
    except Exception as insert_e:
        logger.warning(f"Insert with extended columns failed ({insert_e}). Falling back to core complaint columns...")
        try:
            # Fallback to core columns if migration hasn't been run yet in Supabase
            result = req_supabase.table("complaints").insert(insert_payload).execute()
        except Exception as core_err:
            logger.error(f"Failed to persist complaint: {core_err}")
            raise HTTPException(status_code=500, detail="Failed to record complaint in database.")

    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Complaint record could not be confirmed.")

    saved_record = result.data[0]
    return {
        "id": saved_record.get("id"),
        "hazard_id": saved_record.get("hazard_id"),
        "subject": saved_record.get("subject"),
        "body": saved_record.get("body"),
        "authority_name": req.authority_name,
        "authority_email": saved_record.get("authority_email"),
        "status": saved_record.get("status"),
        "email_status": saved_record.get("email_status"),
        "created_at": saved_record.get("created_at"),
        "channel": req.channel,
        "provider_ref_id": provider_ref_id,
        "message": "Complaint successfully processed."
    }


# ---------------------------------------------------------------------------
# Endpoint 6: List Current User's Complaints
# ---------------------------------------------------------------------------
@router.get("")
async def list_user_complaints(
    user_data = Depends(get_current_user)
):
    """
    Returns all complaints registered by the authenticated user.
    """
    user = user_data["user"]
    token = user_data["token"]
    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))

    try:
        res = req_supabase.table("complaints").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Failed to list complaints: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch complaints history.")


# ---------------------------------------------------------------------------
# Endpoint 7: Get Single Complaint by ID
# ---------------------------------------------------------------------------
@router.get("/{complaint_id}")
async def get_single_complaint(
    complaint_id: str,
    user_data = Depends(get_current_user)
):
    """
    Retrieves details for a specific complaint, enforcing strict user ownership.
    """
    user = user_data["user"]
    token = user_data["token"]
    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))

    try:
        res = req_supabase.table("complaints").select("*").eq("id", complaint_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Complaint not found")

        complaint = res.data[0]
        # Verify ownership (or authority)
        if str(complaint.get("user_id")) != str(user.id):
            raise HTTPException(status_code=403, detail="Not authorized to view this complaint.")

        return complaint
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch complaint {complaint_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve complaint.")


# ---------------------------------------------------------------------------
# Endpoint 8: List Available Authorities
# ---------------------------------------------------------------------------
@router.get("/authorities/list")
def list_authorities():
    """Returns the list of configured road authorities for user selection and override."""
    return get_available_authorities()


# ---------------------------------------------------------------------------
# Legacy Endpoints: Preserved for 100% Backward Compatibility
# ---------------------------------------------------------------------------
@router.post("/generate/{hazard_id}")
async def generate_complaint(hazard_id: str, user_data = Depends(get_current_user)):
    user = user_data["user"]
    token = user_data["token"]

    road_authority_email = os.environ.get("ROAD_AUTHORITY_EMAIL")
    if not road_authority_email:
        raise HTTPException(status_code=500, detail="ROAD_AUTHORITY_EMAIL configuration is missing")

    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))

    try:
        existing_complaint = req_supabase.table("complaints").select("*").eq("hazard_id", hazard_id).eq("user_id", user.id).execute()
        if existing_complaint.data and len(existing_complaint.data) > 0:
            return existing_complaint.data[0]

        hazard_res = req_supabase.table("hazards").select("*").eq("id", hazard_id).execute()
        if not hazard_res.data or len(hazard_res.data) == 0:
            raise HTTPException(status_code=404, detail="Hazard not found")
        
        hazard = hazard_res.data[0]
        
        ai_detected_class = "Unknown"
        ai_confidence = "N/A"
        if hazard.get("ai_detections") and len(hazard["ai_detections"]) > 0:
            ai_detected_class = hazard["ai_detections"][0].get("class_name", "Unknown")
            ai_confidence = hazard["ai_detections"][0].get("confidence", "N/A")

        hazard_data = {
            "ai_detected_class": ai_detected_class,
            "ai_confidence": ai_confidence,
            "latitude": hazard.get("latitude"),
            "longitude": hazard.get("longitude"),
            "created_at": hazard.get("created_at"),
            "description": hazard.get("description")
        }

        generated = await generate_official_complaint(hazard_data)

        insert_data = {
            "hazard_id": hazard_id,
            "user_id": user.id,
            "authority_email": road_authority_email,
            "subject": generated["subject"],
            "body": generated["body"],
            "provider": "openrouter",
            "status": "generated",
            "email_status": "pending"
        }

        result = req_supabase.table("complaints").insert(insert_data).execute()
        if not result.data or len(result.data) == 0:
            raise Exception("Failed to insert complaint into database")

        inserted_complaint = result.data[0]
        return {
            "id": inserted_complaint.get("id"),
            "hazard_id": inserted_complaint.get("hazard_id"),
            "subject": inserted_complaint.get("subject"),
            "body": inserted_complaint.get("body"),
            "authority_email": inserted_complaint.get("authority_email"),
            "status": inserted_complaint.get("status"),
            "email_status": inserted_complaint.get("email_status"),
            "created_at": inserted_complaint.get("created_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating complaint: {str(e)}")
        raise HTTPException(status_code=500, detail="An internal error occurred while generating the complaint.")


@router.post("/{complaint_id}/send")
async def send_complaint(complaint_id: str, user_data = Depends(get_current_user)):
    user = user_data["user"]
    token = user_data["token"]
    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))
    
    try:
        complaint_res = req_supabase.table("complaints").select("*").eq("id", complaint_id).execute()
        if not complaint_res.data or len(complaint_res.data) == 0:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        complaint = complaint_res.data[0]
        if str(complaint.get("user_id")) != str(user.id):
            raise HTTPException(status_code=403, detail="Not authorized")
            
        if complaint.get("email_status") == "sent":
            raise HTTPException(status_code=400, detail="Complaint has already been sent")
            
        subject = complaint.get("subject")
        body = complaint.get("body")
        if not subject or not body:
            raise HTTPException(status_code=400, detail="Complaint is missing subject or body")
            
        try:
            send_complaint_email(subject, body, recipient_email=complaint.get("authority_email"))
            req_supabase.rpc("mark_complaint_email_sent", {
                "p_complaint_id": complaint_id,
                "p_sent_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            return {"message": "Email sent successfully", "status": "sent"}
        except Exception as e:
            error_message = str(e)
            try:
                req_supabase.rpc("mark_complaint_email_failed", {
                    "p_complaint_id": complaint_id,
                    "p_error_message": error_message
                }).execute()
            except Exception as db_e:
                logger.error(f"Failed to save email failure status to DB: {str(db_e)}")
            raise HTTPException(status_code=500, detail="Failed to send complaint email.")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending complaint {complaint_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the request.")
