import os
from dotenv import load_dotenv
load_dotenv(r"D:\RoadGuard\backend\.env")

from fastapi.testclient import TestClient
import sys
sys.path.append(r"D:\RoadGuard\backend")
from app.main import app
from supabase import create_client

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
supabase = create_client(url, key)

def main():
    print("Running E2E test...")
    # 1. Sign up/in a user
    email = "testuser_e2e@example.com"
    password = "testpassword123"
    try:
        auth_res = supabase.auth.sign_up({"email": email, "password": password})
    except Exception as e:
        print("Sign up failed (maybe already exists), trying sign in...")
        auth_res = supabase.auth.sign_in_with_password({"email": email, "password": password})
    
    token = auth_res.session.access_token
    print(f"Got auth token: {token[:10]}...")

    client = TestClient(app)

    # 2. Simulate POST /api/ml/detect
    # We will just bypass it and mock the frontend behavior, 
    # but the instructions say "image upload -> AI detection -> report submission"
    # We can create a dummy image
    from io import BytesIO
    from PIL import Image
    img = Image.new("RGB", (100, 100), color="gray")
    img_byte_arr = BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()

    print("Calling /api/ml/detect...")
    res_ml = client.post("/api/ml/detect", files={"file": ("test.jpg", img_byte_arr, "image/jpeg")})
    print("ML Status:", res_ml.status_code)
    print("ML Response:", res_ml.json())
    ml_data = res_ml.json()

    # 3. Simulate POST /api/hazards
    payload = {
        "image_url": "test_e2e.jpg",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "description": "Test E2E",
        "ai_detections": ml_data.get("detected_objects", []),
        "severity": "low"
    }

    print("Calling /api/hazards...")
    res_hazard = client.post(
        "/api/hazards", 
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    print("Hazard Status:", res_hazard.status_code)
    if res_hazard.status_code != 200:
        print("Hazard Error:", res_hazard.json())
    else:
        print("Hazard Response:", res_hazard.json())
        print("TEST SUCCESSFUL!")

if __name__ == "__main__":
    main()
