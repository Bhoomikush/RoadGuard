import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("D:/RoadGuard/backend/.env")

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

supabase: Client = create_client(url, key)

data = {
    "user_id": "00000000-0000-0000-0000-000000000000",
    "image_url": "test.jpg",
    "latitude": 10.0,
    "longitude": 10.0,
    "description": "test",
    "status": "pending",
    "severity": None
}

try:
    result = supabase.table("hazards").insert(data).execute()
    print("Success:", result.data)
except Exception as e:
    print("Error:", str(e))
    
    if hasattr(e, 'response'):
        print("Response detail:", e.response.json())
    if hasattr(e, 'message'):
        print("Message:", e.message)
    if hasattr(e, 'details'):
        print("Details:", e.details)
    
