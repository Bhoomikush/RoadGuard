from fastapi import APIRouter, Depends, HTTPException, Header, Query
from ..dependencies import get_current_user
import httpx
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

def map_weather_code(code: int) -> str:
    if code == 0: return "Clear"
    elif code in [1, 2]: return "Partly Cloudy"
    elif code == 3: return "Cloudy"
    elif code in [45, 48]: return "Fog"
    elif code in [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]: return "Rain"
    elif code in [71, 73, 75, 77, 85, 86]: return "Snow"
    elif code in [95, 96, 99]: return "Thunderstorm"
    return "Unknown"

@router.get("/weather")
async def get_hazard_weather(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude"),
    user_data = Depends(get_current_user)
):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            current = data.get("current", {})
            if not current:
                raise ValueError("Malformed response from Open-Meteo")
                
            return {
                "temperature": current.get("temperature_2m", 0.0),
                "precipitation": current.get("precipitation", 0.0),
                "wind_speed": current.get("wind_speed_10m", 0.0),
                "condition": map_weather_code(current.get("weather_code", -1))
            }
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Weather service timeout.")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Failed to connect to weather service.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Weather service returned an error.")
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal error occurred while fetching weather data.")
