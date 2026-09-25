import sys
import os
import math
from dotenv import load_dotenv
from supabase import create_client

# load the backend env for supabase keys
load_dotenv(os.path.join(os.path.dirname(__file__), "../backend/.env"))

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
if not url or not key:
    print("Missing credentials")
    sys.exit(1)

supabase = create_client(url, key)

result = supabase.table("hazards").select("*").execute()
hazards = result.data

active_hazards = [h for h in hazards if h.get("status") != "resolved"]

def get_distance_meters(lat1, lon1, lat2, lon2):
    R = 6371e3
    phi1 = lat1 * math.pi / 180
    phi2 = lat2 * math.pi / 180
    delta_phi = (lat2 - lat1) * math.pi / 180
    delta_lambda = (lon2 - lon1) * math.pi / 180
    a = math.sin(delta_phi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

assigned = set()
zones = []

for root in active_hazards:
    if root["id"] in assigned:
        continue
    
    cluster = [root]
    assigned.add(root["id"])
    
    added = True
    while added:
        added = False
        for candidate in active_hazards:
            if candidate["id"] in assigned:
                continue
            
            is_near = False
            for member in cluster:
                dist = get_distance_meters(member["latitude"], member["longitude"], candidate["latitude"], candidate["longitude"])
                if dist <= 300:
                    is_near = True
                    break
            
            if is_near:
                cluster.append(candidate)
                assigned.add(candidate["id"])
                added = True
                
    if len(cluster) >= 2:
        zones.append(cluster)

print(f"Total hazards: {len(hazards)}")
print(f"Active hazards: {len(active_hazards)}")
print(f"Calculated risk zones: {len(zones)}")
