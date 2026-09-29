import os
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, ClientOptions
from ..dependencies import get_current_user
from ..services.complaints_service import generate_official_complaint
from ..services.email_service import send_complaint_email
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/complaints",
    tags=["complaints"],
)

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

@router.post("/generate/{hazard_id}")
async def generate_complaint(hazard_id: str, user_data = Depends(get_current_user)):
    user = user_data["user"]
    token = user_data["token"]

    road_authority_email = os.environ.get("ROAD_AUTHORITY_EMAIL")
    if not road_authority_email:
        raise HTTPException(status_code=500, detail="ROAD_AUTHORITY_EMAIL configuration is missing")

    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))

    try:
        # Check if complaint already exists for this hazard_id for this user
        existing_complaint = req_supabase.table("complaints").select("*").eq("hazard_id", hazard_id).eq("user_id", user.id).execute()
        if existing_complaint.data and len(existing_complaint.data) > 0:
            return existing_complaint.data[0]

        # Fetch the hazard
        hazard_res = req_supabase.table("hazards").select("*").eq("id", hazard_id).execute()
        if not hazard_res.data or len(hazard_res.data) == 0:
            raise HTTPException(status_code=404, detail="Hazard not found")
        
        hazard = hazard_res.data[0]
        
        # Prepare hazard data for the prompt
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

        # Generate complaint
        generated = await generate_official_complaint(hazard_data)

        # Insert into public.complaints
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
        
        # Return only the safe subset
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
        # Safe error returned to client
        if str(e) == "Failed to communicate with AI provider." or \
           str(e) == "Failed to parse AI response." or \
           str(e) == "Invalid AI response format." or \
           str(e) == "An unexpected error occurred during complaint generation.":
            raise HTTPException(status_code=500, detail=str(e))
        
        raise HTTPException(status_code=500, detail="An internal error occurred while generating the complaint.")

@router.post("/{complaint_id}/send")
async def send_complaint(complaint_id: str, user_data = Depends(get_current_user)):
    user = user_data["user"]
    token = user_data["token"]
    
    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))
    
    try:
        # Fetch the complaint
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
            # Send the email
            send_complaint_email(subject, body)
            
            # Update success via secure RPC
            req_supabase.rpc("mark_complaint_email_sent", {
                "p_complaint_id": complaint_id,
                "p_sent_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            
            return {"message": "Email sent successfully", "status": "sent"}
            
        except Exception as e:
            # Update failure via secure RPC
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
