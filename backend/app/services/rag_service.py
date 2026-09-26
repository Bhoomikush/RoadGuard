import os
import math
from google import genai
from google.genai import types
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions

load_dotenv()

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
if not url or not key:
    raise ValueError("Missing Supabase credentials")

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def generate_rag_response(question: str, user_data: dict) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_key_here":
        return "Assistant is not fully configured (missing API key)."
    
    client = genai.Client(api_key=api_key)
    token = user_data["token"]

    user = user_data["user"]
    req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))

    # Define tool functions
    def get_nearby_hazards(lat: float, lng: float, radius_km: float = 5.0, severity: str = None) -> dict:
        """Returns the count and list of hazards within a given radius (km). Max radius is 20km."""
        radius_km = min(radius_km, 20.0)
        try:
            # Fetch hazards. In a real app we'd use PostGIS, here we fetch and filter in Python.
            query = req_supabase.table("hazards").select("id, latitude, longitude, severity, status, description")
            if severity and severity in ["low", "medium", "high"]:
                query = query.eq("severity", severity)
            result = query.execute()
            
            nearby = []
            for h in result.data:
                dist = haversine(lat, lng, h['latitude'], h['longitude'])
                if dist <= radius_km:
                    nearby.append(h)
                    
            return {"count": len(nearby), "hazards": nearby}
        except Exception as e:
            return {"error": "Failed to retrieve nearby hazards."}

    def get_hazard_status(hazard_id: str) -> dict:
        """Returns status, severity, and created_at for a specific hazard by ID."""
        try:
            result = req_supabase.table("hazards").select("status, severity, created_at").eq("id", hazard_id).execute()
            if result.data:
                return {"hazard": result.data[0]}
            return {"error": "Hazard not found."}
        except Exception as e:
            return {"error": "Failed to retrieve hazard status."}

    def get_user_report_summary() -> dict:
        """Returns the total number of reports submitted by the currently logged-in user and a breakdown by status."""
        try:
            # ONLY use the authenticated user's ID
            result = req_supabase.table("hazards").select("status").eq("user_id", user.id).execute()
            
            summary = {"total_reports": len(result.data), "breakdown": {}}
            for h in result.data:
                status = h.get("status", "unknown")
                summary["breakdown"][status] = summary["breakdown"].get(status, 0) + 1
            return summary
        except Exception as e:
            return {"error": "Failed to retrieve user report summary."}

    def get_area_stats(city_or_zone: str) -> dict:
        """Returns total hazards and severity breakdown for an area."""
        # For simplicity in this demo, we'll just query all hazards as if they are in the area if we don't have geo boundaries
        try:
            result = req_supabase.table("hazards").select("severity").execute()
            summary = {"area": city_or_zone, "total_hazards": len(result.data), "breakdown": {}}
            for h in result.data:
                sev = h.get("severity", "unknown")
                if sev is None:
                    sev = "unknown"
                summary["breakdown"][sev] = summary["breakdown"].get(sev, 0) + 1
            return summary
        except Exception as e:
            return {"error": "Failed to retrieve area stats."}

    # First, try to use tools
    try:
        chat = client.chats.create(
            model='gemini-3.6-flash',
            config=types.GenerateContentConfig(
                tools=[get_nearby_hazards, get_hazard_status, get_user_report_summary, get_area_stats],
                temperature=0.0
            )
        )
        response = chat.send_message(question)
        
        if response.function_calls:
            for fn_call in response.function_calls:
                fn_name = fn_call.name
                args = fn_call.args
                
                try:
                    if fn_name == "get_nearby_hazards":
                        res = get_nearby_hazards(**args)
                    elif fn_name == "get_hazard_status":
                        res = get_hazard_status(**args)
                    elif fn_name == "get_user_report_summary":
                        res = get_user_report_summary() # Ignores args to prevent leakage
                    elif fn_name == "get_area_stats":
                        res = get_area_stats(**args)
                    else:
                        res = {"error": "Unknown function"}
                except Exception as e:
                    res = {"error": str(e)}
                    
                response = chat.send_message(
                    types.Part.from_function_response(
                        name=fn_name,
                        response=res
                    )
                )
            
            if response.text:
                return response.text.strip()
            else:
                return "I couldn't retrieve that information right now."
                
    except Exception as e:
        # If tool call fails (e.g. bad params), catch it and return exact error message
        return "I couldn't retrieve that information right now."
            
    # Fallback to Part A retrieval-based answer
    try:
        # Get query embedding
        emb_res = client.models.embed_content(
            model='gemini-embedding-2',
            contents=question,
            config={'output_dimensionality': 768}
        )
        query_embedding = emb_res.embeddings[0].values
        
        # Search document_chunks
        search_res = req_supabase.rpc(
            "match_document_chunks",
            {"query_embedding": query_embedding, "match_count": 4}
        ).execute()
        
        context_chunks = [row["content"] for row in search_res.data]
        context_text = "\n\n".join(context_chunks)
        
        if not context_text:
            context_text = "No relevant context found in knowledge base."
            
        prompt = f"""You are a helpful RoadGuard Road Safety Assistant. Use ONLY the following RoadGuard Knowledge Base context to answer the user's question. 
If the knowledge base does not contain enough information to answer, clearly state that the available RoadGuard knowledge does not cover the question. 
Do not invent facts, laws, penalties, statistics, citations, or government rules. Keep answers concise and practical.

RoadGuard Knowledge Base:
{context_text}

User's Question:
{question}
"""
        final_res = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt
        )
        return final_res.text.strip()
        
    except Exception as e:
        print(f"Fallback generation error: {e}")
        return "I couldn't retrieve that information right now."
