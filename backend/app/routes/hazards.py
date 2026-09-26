from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client, ClientOptions
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/api/hazards",
    tags=["hazards"],
)

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

if not url or not key:
    raise ValueError("Missing Supabase credentials in environment variables")

supabase: Client = create_client(url, key)

class HazardCreate(BaseModel):
    image_url: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    ai_detections: Optional[list] = None
    severity: Optional[str] = None

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    
    try:

        # Use get_user to validate the token
        res = supabase.auth.get_user(token)
        if not res.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user": res.user, "token": token}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@router.post("")
async def create_hazard(hazard: HazardCreate, user_data = Depends(get_current_user)):
    user = user_data["user"]
    token = user_data["token"]
    
    # Create an authenticated client for this request to satisfy RLS
    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))
    
    try:
        # Insert the hazard into the database
        data = {
            "user_id": user.id,
            "image_url": hazard.image_url,
            "latitude": hazard.latitude,
            "longitude": hazard.longitude,
            "description": hazard.description,
            "status": "pending",
            "severity": hazard.severity,
            "ai_detections": hazard.ai_detections
        }
        
        try:
            result = req_supabase.table("hazards").insert(data).execute()
        except Exception as insert_error:
            error_str = str(insert_error)
            # If Supabase cache hasn't updated yet (PGRST204), try without ai_detections
            if "PGRST204" in error_str or "ai_detections" in error_str:
                del data["ai_detections"]
                result = req_supabase.table("hazards").insert(data).execute()
            else:
                raise insert_error
        
        return result.data[0]
    except Exception as e:
        # DB insert failed, clean up the orphaned image using the user's client
        try:
            req_supabase.storage.from_("hazard-images").remove([hazard.image_url])
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="An internal error occurred while creating the hazard.")

@router.get("")
async def get_hazards(user_data = Depends(get_current_user)):
    token = user_data["token"]
    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))
    try:
        # Fetch hazards ordered by newest first
        result = req_supabase.table("hazards").select("id, image_url, latitude, longitude, description, status, severity, ai_detections, created_at").order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal error occurred while fetching hazards.")
