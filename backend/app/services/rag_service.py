import os
import math
import re
from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions
import httpx

load_dotenv()

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_weather_context(lat: float, lng: float) -> str:
    if lat is None or lng is None:
        return ""
    try:
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code"
        with httpx.Client(timeout=5.0) as client:
            response = client.get(weather_url)
            response.raise_for_status()
            data = response.json()
            current = data.get("current")
            if not current:
                return ""

            code = current.get("weather_code", -1)
            condition = "Unknown"
            if code == 0: condition = "Clear"
            elif code in [1, 2]: condition = "Partly Cloudy"
            elif code == 3: condition = "Cloudy"
            elif code in [45, 48]: condition = "Fog"
            elif code in [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]: condition = "Rain"
            elif code in [71, 73, 75, 77, 85, 86]: condition = "Snow"
            elif code in [95, 96, 99]: condition = "Thunderstorm"

            temp = current.get("temperature_2m", "N/A")
            precip = current.get("precipitation", "N/A")
            wind = current.get("wind_speed_10m", "N/A")

            return f"Current weather:\nTemperature: {temp}°C\nCondition: {condition}\nPrecipitation: {precip} mm\nWind: {wind} km/h"
    except Exception as e:
        return ""


def is_live_data_query(question: str) -> bool:
    """
    Classifies whether the user is asking about live operational data:
    nearby hazards, my reports, specific hazard status, or area statistics.
    """
    q = question.lower()
    live_patterns = [
        r"\bnearby\b",
        r"\bnear me\b",
        r"\baround me\b",
        r"\bhow many hazards?\b",
        r"\bmy reports?\b",
        r"\bmy complaints?\b",
        r"\bstatus of\b",
        r"\bhazard (id|#|[0-9a-f-]{8,})",
        r"\bin mumbai\b|\bin pune\b|\bin thane\b|\bin nashik\b|\bareas?\b",
        r"\bstats\b|\bstatistics\b"
    ]
    return any(re.search(pat, q) for pat in live_patterns)


def is_knowledge_query(question: str) -> bool:
    """
    Classifies whether the question asks for road safety rules, guidelines,
    hazard definitions, pothole dangers, crack types, or precautions.
    """
    q = question.lower()
    knowledge_patterns = [
        r"\bpotholes?\b",
        r"\bcracks?\b",
        r"\bwaterlog",
        r"\bgravel\b",
        r"\bseverity\b",
        r"\brisks?\b",
        r"\bprecautions?\b",
        r"\bsafety\b",
        r"\bguidelines?\b",
        r"\brules?\b",
        r"\bhow to navigate\b",
        r"\bwhat should i do\b",
        r"\btwo-wheelers?\b",
        r"\bspeeds?\b",
        r"\bcorrugation\b",
        r"\brutting\b"
    ]
    return any(re.search(pat, q) for pat in knowledge_patterns)


def retrieve_semantic_context(
    client: Any,
    req_supabase: Any,
    question: str,
    match_count: int = 4
) -> List[str]:
    """
    Embeds the user question via gemini-embedding-2 and executes match_document_chunks RPC.
    Returns list of matching content chunks.
    """
    try:
        emb_res = client.models.embed_content(
            model='gemini-embedding-2',
            contents=question,
            config={'output_dimensionality': 768}
        )
        if not emb_res or not emb_res.embeddings:
            return []
        query_embedding = emb_res.embeddings[0].values

        search_res = req_supabase.rpc(
            "match_document_chunks",
            {"query_embedding": query_embedding, "match_count": match_count}
        ).execute()

        if search_res and search_res.data:
            return [row["content"] for row in search_res.data if "content" in row and row["content"]]
    except Exception as e:
        # RPC missing, table empty, or network error
        pass
    return []


def generate_rag_response(
    question: str,
    user_data: dict,
    lat: float = None,
    lng: float = None
) -> str:
    """
    Answers user queries using:
    1. Direct live-data tools (if querying personal reports, live hazard counts, or area stats).
    2. Grounded semantic retrieval from RoadGuard Knowledge Base (for road safety / hazard guidance).
    3. Resilient OpenRouter LLM call using gemini-2.5-flash with appropriate max_tokens.
    """
    clean_question = question.strip() if question else ""
    if not clean_question:
        return "Please ask a question regarding road safety or reported road hazards."

    openrouter_api_key = os.environ.get("OPENROUTER_API_KEY")
    openrouter_model = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.5-flash")

    token = user_data.get("token")
    user = user_data.get("user")
    req_supabase = None
    if url and key and token:
        try:
            req_supabase = create_client(url, key, options=ClientOptions(headers={"Authorization": f"Bearer {token}"}))
        except Exception:
            pass

    # Tool functions for live data queries
    def get_nearby_hazards(lat_val: float, lng_val: float, radius_km: float = 5.0) -> dict:
        if not req_supabase:
            return {"error": "Database unavailable"}
        radius_km = min(radius_km, 20.0)
        try:
            result = req_supabase.table("hazards").select("id, latitude, longitude, severity, status, description").execute()
            nearby = []
            for h in (result.data or []):
                dist = haversine(lat_val, lng_val, h['latitude'], h['longitude'])
                if dist <= radius_km:
                    nearby.append(h)
            return {"count": len(nearby), "hazards": nearby[:10]}
        except Exception:
            return {"error": "Failed to retrieve nearby hazards."}

    def get_user_report_summary() -> dict:
        if not req_supabase or not user:
            return {"error": "User data unavailable"}
        try:
            result = req_supabase.table("hazards").select("status, severity").eq("user_id", user.id).execute()
            summary = {"total_reports": len(result.data or []), "breakdown": {}}
            for h in (result.data or []):
                status = h.get("status", "unknown")
                summary["breakdown"][status] = summary["breakdown"].get(status, 0) + 1
            return summary
        except Exception:
            return {"error": "Failed to retrieve user report summary."}

    def get_area_stats(city_or_zone: str) -> dict:
        if not req_supabase:
            return {"error": "Database unavailable"}
        try:
            result = req_supabase.table("hazards").select("severity").execute()
            summary = {"area": city_or_zone, "total_hazards": len(result.data or []), "breakdown": {}}
            for h in (result.data or []):
                sev = h.get("severity") or "unknown"
                summary["breakdown"][sev] = summary["breakdown"].get(sev, 0) + 1
            return summary
        except Exception:
            return {"error": "Failed to retrieve area stats."}

    weather_context = get_weather_context(lat, lng) if (lat is not None and lng is not None) else ""

    # Live operational data injection
    live_context_parts = []
    if is_live_data_query(clean_question):
        if re.search(r"\bmy reports?\b|\bmy complaints?\b", clean_question.lower()):
            user_summary = get_user_report_summary()
            live_context_parts.append(f"User's submitted reports summary: {json.dumps(user_summary)}")
        if lat is not None and lng is not None and re.search(r"\bnearby\b|\bnear me\b|\baround me\b", clean_question.lower()):
            nearby_summary = get_nearby_hazards(lat, lng)
            live_context_parts.append(f"Live nearby road hazards within 5km: {json.dumps(nearby_summary)}")
        if re.search(r"\bstats\b|\bhow many\b|\bareas?\b", clean_question.lower()):
            area_summary = get_area_stats("Current Region")
            live_context_parts.append(f"Area statistics: {json.dumps(area_summary)}")

    # Knowledge / Semantic context
    context_chunks = []
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key and req_supabase:
        try:
            genai_client = genai.Client(api_key=gemini_key)
            context_chunks = retrieve_semantic_context(genai_client, req_supabase, clean_question, match_count=4)
        except Exception:
            pass

    system_instruction = (
        "You are RoadGuard AI, an expert road safety and hazard intelligence assistant.\n"
        "Your mission is to help citizens understand road dangers (potholes, cracks, waterlogging, uneven roads), "
        "advise safe driving and riding precautions, explain hazard severity classifications, and provide accurate hazard reporting guidance.\n"
        "Tone: Professional, helpful, concise, and safety-oriented.\n"
        "Do NOT hallucinate legal fines or citations not provided in context. If unsure, advise driving cautiously and reporting via RoadGuard."
    )

    context_prompt_parts = []
    if context_chunks:
        context_prompt_parts.append("Verified RoadGuard Knowledge:\n" + "\n\n".join(context_chunks))
    if live_context_parts:
        context_prompt_parts.append("Live System Data:\n" + "\n".join(live_context_parts))
    if weather_context:
        context_prompt_parts.append(weather_context.strip())

    combined_context = "\n\n".join(context_prompt_parts)
    user_prompt = f"User Question: {clean_question}"
    if combined_context:
        user_prompt = f"Context Information:\n{combined_context}\n\n{user_prompt}"

    # Try OpenRouter with gemini-2.5-flash
    if openrouter_api_key:
        try:
            with httpx.Client(timeout=25.0) as http_client:
                resp = http_client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openrouter_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": openrouter_model,
                        "max_tokens": 800,
                        "messages": [
                            {"role": "system", "content": system_instruction},
                            {"role": "user", "content": user_prompt}
                        ]
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        reply = choices[0]["message"].get("content", "").strip()
                        if reply:
                            return reply
        except Exception as o_err:
            pass

    # Fallback to direct Gemini API if configured
    if gemini_key:
        try:
            genai_client = genai.Client(api_key=gemini_key)
            final_res = genai_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=f"{system_instruction}\n\n{user_prompt}"
            )
            if final_res and final_res.text:
                return final_res.text.strip()
        except Exception:
            pass

    # Built-in knowledge fallback if both APIs fail
    q_lower = clean_question.lower()
    if "pothole" in q_lower:
        return (
            "A high-severity pothole is a deep, wide depression in the pavement (typically deeper than 5 cm / 2 inches) "
            "with steep, jagged edges. It poses severe risk of tire blowouts, rim damage, suspension failure, and loss of vehicle control, "
            "especially for two-wheelers. Drive with caution and submit an official report with photo or voice evidence so local authorities can prioritize road repair."
        )
    if "crack" in q_lower:
        return (
            "Road cracks indicate structural fatigue in the asphalt. Severe alligator or longitudinal cracking allows water penetration, "
            "which quickly destabilizes the road sub-base and develops into hazardous potholes."
        )

    return (
        "I am currently experiencing higher than usual traffic. Please stay safe on the roads and try your question again in a moment."
    )
