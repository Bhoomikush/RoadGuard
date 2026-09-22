import os
import sys
from dotenv import load_dotenv
from supabase import create_client, ClientOptions

load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

if not url or not key:
    print("Missing Supabase credentials")
    sys.exit(1)

# Mimic the hazard.py request
token = sys.argv[1] if len(sys.argv) > 1 else "fake_token"
user_id = "00000000-0000-0000-0000-000000000000"

req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))

data = {
    "user_id": user_id,
    "image_url": "test.jpg",
    "latitude": 0.0,
    "longitude": 0.0,
    "description": "test",
    "status": "pending",
    "severity": "low",
    "ai_detections": []
}

try:
    result = req_supabase.table("hazards").insert(data).execute()
    print("Success:", result)
except Exception as e:
    print("Error:", repr(e))
