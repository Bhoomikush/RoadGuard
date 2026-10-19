import os
import re
from typing import Optional, Dict, Any, List

# Configurable Authority Registry
# In production, this can also be extended via environment or external JSON configuration.
AUTHORITIES: Dict[str, Dict[str, Any]] = {
    # 1. National Highway Authority of India
    "nhai": {
        "id": "nhai",
        "name": "National Highways Authority of India (NHAI)",
        "type": "national_highway",
        "jurisdiction": "All National Highways across India (NH-* routes and expressways)",
        "email": os.environ.get("NHAI_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "1033",
        "portal_url": "https://pgportal.gov.in",
        "description": "Responsible for development, maintenance, and management of National Highways."
    },
    # 2. Municipal Corporations (Maharashtra)
    "bmc_mumbai": {
        "id": "bmc_mumbai",
        "name": "Brihanmumbai Municipal Corporation (BMC)",
        "type": "municipal",
        "jurisdiction": "Mumbai City & Mumbai Suburban",
        "email": os.environ.get("BMC_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "1916",
        "portal_url": "https://portal.mcgm.gov.in",
        "description": "Governing civic body of Mumbai, responsible for municipal and arterial city roads."
    },
    "pmc_pune": {
        "id": "pmc_pune",
        "name": "Pune Municipal Corporation (PMC)",
        "type": "municipal",
        "jurisdiction": "Pune Municipal Area",
        "email": os.environ.get("PMC_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "1800-1030-222",
        "portal_url": "https://complaint.punecorporation.org",
        "description": "Civic body overseeing municipal infrastructure, city roads, and flyovers in Pune."
    },
    "tmc_thane": {
        "id": "tmc_thane",
        "name": "Thane Municipal Corporation (TMC)",
        "type": "municipal",
        "jurisdiction": "Thane City",
        "email": os.environ.get("TMC_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "1800-222-108",
        "portal_url": "https://thanecity.gov.in",
        "description": "Municipal authority governing civic services and roads in Thane city."
    },
    "pcmc_pimpri": {
        "id": "pcmc_pimpri",
        "name": "Pimpri-Chinchwad Municipal Corporation (PCMC)",
        "type": "municipal",
        "jurisdiction": "Pimpri-Chinchwad Area",
        "email": os.environ.get("PCMC_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "020-67333333",
        "portal_url": "https://www.pcmcindia.gov.in",
        "description": "Municipal corporation administering Pimpri-Chinchwad municipal limits."
    },
    "nmmc_navi_mumbai": {
        "id": "nmmc_navi_mumbai",
        "name": "Navi Mumbai Municipal Corporation (NMMC)",
        "type": "municipal",
        "jurisdiction": "Navi Mumbai Area",
        "email": os.environ.get("NMMC_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "1800-222-309",
        "portal_url": "https://www.nmmc.gov.in",
        "description": "Civic governing body for the planned township of Navi Mumbai."
    },
    "nmc_nagpur": {
        "id": "nmc_nagpur",
        "name": "Nagpur Municipal Corporation (NMC)",
        "type": "municipal",
        "jurisdiction": "Nagpur Municipal Area",
        "email": os.environ.get("NMC_NAGPUR_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "0712-2567035",
        "portal_url": "https://www.nmcnagpur.gov.in",
        "description": "Civic authority managing roads and infrastructure in Nagpur city."
    },
    "nmc_nashik": {
        "id": "nmc_nashik",
        "name": "Nashik Municipal Corporation (NMC)",
        "type": "municipal",
        "jurisdiction": "Nashik Municipal Area",
        "email": os.environ.get("NMC_NASHIK_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "0253-2575631",
        "portal_url": "https://nmc.gov.in",
        "description": "Civic authority responsible for municipal roads in Nashik."
    },
    "csmc_aurangabad": {
        "id": "csmc_aurangabad",
        "name": "Chhatrapati Sambhajinagar Municipal Corporation",
        "type": "municipal",
        "jurisdiction": "Chhatrapati Sambhajinagar (Aurangabad) City",
        "email": os.environ.get("CSMC_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "0240-2333536",
        "portal_url": "https://aurangabadmahapalika.org",
        "description": "Municipal corporation administering city roads in Chhatrapati Sambhajinagar."
    },
    # 3. State Public Works Department (Maharashtra PWD Regions)
    "pwd_konkan": {
        "id": "pwd_konkan",
        "name": "Maharashtra PWD - Konkan Region",
        "type": "pwd",
        "jurisdiction": "Districts: Mumbai, Thane, Palghar, Raigad, Ratnagiri, Sindhudurg",
        "email": os.environ.get("PWD_KONKAN_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "022-22026725",
        "portal_url": "https://mahapwd.gov.in",
        "description": "Public Works Department region overseeing state highways and major district roads in Konkan."
    },
    "pwd_pune": {
        "id": "pwd_pune",
        "name": "Maharashtra PWD - Pune Region",
        "type": "pwd",
        "jurisdiction": "Districts: Pune, Satara, Solapur, Kolhapur, Sangli",
        "email": os.environ.get("PWD_PUNE_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "020-26122847",
        "portal_url": "https://mahapwd.gov.in",
        "description": "Public Works Department region overseeing state highways and district roads in Western Maharashtra."
    },
    "pwd_nashik": {
        "id": "pwd_nashik",
        "name": "Maharashtra PWD - Nashik Region",
        "type": "pwd",
        "jurisdiction": "Districts: Nashik, Ahmednagar (Ahilyanagar), Dhule, Jalgaon, Nandurbar",
        "email": os.environ.get("PWD_NASHIK_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "0253-2574044",
        "portal_url": "https://mahapwd.gov.in",
        "description": "Public Works Department region overseeing state road infrastructure in Northern Maharashtra."
    },
    "pwd_chhatrapati_sambhajinagar": {
        "id": "pwd_chhatrapati_sambhajinagar",
        "name": "Maharashtra PWD - Chhatrapati Sambhajinagar Region",
        "type": "pwd",
        "jurisdiction": "Districts: Aurangabad, Jalna, Parbhani, Hingoli, Nanded, Beed, Latur, Dharashiv",
        "email": os.environ.get("PWD_CSN_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "0240-2331524",
        "portal_url": "https://mahapwd.gov.in",
        "description": "Public Works Department region overseeing state highways across Marathwada."
    },
    "pwd_amravati": {
        "id": "pwd_amravati",
        "name": "Maharashtra PWD - Amravati Region",
        "type": "pwd",
        "jurisdiction": "Districts: Amravati, Akola, Yavatmal, Buldhana, Washim",
        "email": os.environ.get("PWD_AMRAVATI_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "0721-2662646",
        "portal_url": "https://mahapwd.gov.in",
        "description": "Public Works Department region overseeing state infrastructure in West Vidarbha."
    },
    "pwd_nagpur": {
        "id": "pwd_nagpur",
        "name": "Maharashtra PWD - Nagpur Region",
        "type": "pwd",
        "jurisdiction": "Districts: Nagpur, Wardha, Bhandara, Gondia, Chandrapur, Gadchiroli",
        "email": os.environ.get("PWD_NAGPUR_EMAIL") or os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "0712-2560126",
        "portal_url": "https://mahapwd.gov.in",
        "description": "Public Works Department region overseeing state highways in East Vidarbha."
    },
    # 4. Central & General Fallbacks
    "cpgrams_central": {
        "id": "cpgrams_central",
        "name": "Centralized Public Grievance Portal (CPGRAMS)",
        "type": "portal",
        "jurisdiction": "All India - Central and State Road Grievances",
        "email": os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "1800-11-0031",
        "portal_url": "https://pgportal.gov.in",
        "description": "Government of India central grievance portal directing complaints to appropriate ministries."
    },
    "aaple_sarkar": {
        "id": "aaple_sarkar",
        "name": "Aaple Sarkar Grievance Portal (Govt of Maharashtra)",
        "type": "portal",
        "jurisdiction": "Government of Maharashtra State Roads & Municipal Grievances",
        "email": os.environ.get("ROAD_AUTHORITY_EMAIL", "complaints@roadguard.internal"),
        "helpline": "1800-120-8040",
        "portal_url": "https://grievances.maharashtra.gov.in",
        "description": "Official grievance redressal portal of the Government of Maharashtra."
    }
}

# Municipal City / District Lookup
MUNICIPAL_LOOKUP = {
    "mumbai": "bmc_mumbai",
    "mumbai city": "bmc_mumbai",
    "mumbai suburban": "bmc_mumbai",
    "bombay": "bmc_mumbai",
    "pune": "pmc_pune",
    "haveli": "pmc_pune",
    "thane": "tmc_thane",
    "pimpri-chinchwad": "pcmc_pimpri",
    "pimpri": "pcmc_pimpri",
    "chinchwad": "pcmc_pimpri",
    "navi mumbai": "nmmc_navi_mumbai",
    "nagpur": "nmc_nagpur",
    "nashik": "nmc_nashik",
    "aurangabad": "csmc_aurangabad",
    "chhatrapati sambhajinagar": "csmc_aurangabad"
}

# Maharashtra District to PWD Region Mapping
DISTRICT_TO_PWD = {
    # Konkan Region
    "mumbai": "pwd_konkan",
    "mumbai suburban": "pwd_konkan",
    "mumbai city": "pwd_konkan",
    "thane": "pwd_konkan",
    "palghar": "pwd_konkan",
    "raigad": "pwd_konkan",
    "ratnagiri": "pwd_konkan",
    "sindhudurg": "pwd_konkan",
    # Pune Region
    "pune": "pwd_pune",
    "satara": "pwd_pune",
    "solapur": "pwd_pune",
    "kolhapur": "pwd_pune",
    "sangli": "pwd_pune",
    # Nashik Region
    "nashik": "pwd_nashik",
    "ahmednagar": "pwd_nashik",
    "ahilyanagar": "pwd_nashik",
    "dhule": "pwd_nashik",
    "jalgaon": "pwd_nashik",
    "nandurbar": "pwd_nashik",
    # Marathwada / CSN Region
    "aurangabad": "pwd_chhatrapati_sambhajinagar",
    "chhatrapati sambhajinagar": "pwd_chhatrapati_sambhajinagar",
    "jalna": "pwd_chhatrapati_sambhajinagar",
    "parbhani": "pwd_chhatrapati_sambhajinagar",
    "hingoli": "pwd_chhatrapati_sambhajinagar",
    "nanded": "pwd_chhatrapati_sambhajinagar",
    "beed": "pwd_chhatrapati_sambhajinagar",
    "latur": "pwd_chhatrapati_sambhajinagar",
    "osmanabad": "pwd_chhatrapati_sambhajinagar",
    "dharashiv": "pwd_chhatrapati_sambhajinagar",
    # Amravati Region
    "amravati": "pwd_amravati",
    "akola": "pwd_amravati",
    "yavatmal": "pwd_amravati",
    "buldhana": "pwd_amravati",
    "washim": "pwd_amravati",
    # Nagpur Region
    "nagpur": "pwd_nagpur",
    "wardha": "pwd_nagpur",
    "bhandara": "pwd_nagpur",
    "gondia": "pwd_nagpur",
    "chandrapur": "pwd_nagpur",
    "gadchiroli": "pwd_nagpur"
}


def is_national_highway(road_type: Optional[str], road_name: Optional[str]) -> bool:
    """Checks whether the road is confirmed to be a National Highway."""
    if road_type and road_type.strip().lower() in ["national_highway", "highway", "motorway", "trunk"]:
        return True
    if road_name:
        clean_name = road_name.strip()
        # Matches patterns like NH-48, NH 66, National Highway 4, etc.
        if re.search(r'\b(NH[-\s]?\d+|National\s+Highway(\s+\d+)?)\b', clean_name, re.IGNORECASE):
            return True
    return False


def pick_authority(
    city: Optional[str] = None,
    district: Optional[str] = None,
    road_type: Optional[str] = None,
    road_name: Optional[str] = None,
    state: Optional[str] = None
) -> Dict[str, Any]:
    """
    Selects the most appropriate road authority based on verified location parameters.
    
    Routing rules:
    1. Prefer NHAI for confirmed National Highway issues.
    2. Use a verified municipal authority when the location falls within its jurisdiction.
    3. Otherwise suggest the appropriate state PWD region based on verified district information.
    4. If the responsible authority cannot be identified confidently, return a clear fallback
       and prompt the user to choose.
    """
    clean_city = (city or "").strip().lower()
    clean_district = (district or "").strip().lower()
    clean_state = (state or "").strip().lower()

    # Rule 1: National Highway check
    if is_national_highway(road_type, road_name):
        nhai_auth = AUTHORITIES["nhai"].copy()
        nhai_auth["confidence"] = "high"
        nhai_auth["reason"] = f"National Highway detected ({road_name or 'NH route'}). NHAI maintains all national highway corridors."
        nhai_auth["requires_user_choice"] = False
        return nhai_auth

    # Rule 2: Verified Municipal Authority within jurisdiction
    # Check city first, then district
    matched_municipal_id = None
    matched_term = None
    for term, auth_id in MUNICIPAL_LOOKUP.items():
        if term in clean_city or term in clean_district:
            matched_municipal_id = auth_id
            matched_term = term
            break

    # If it's within municipal limits and not explicitly marked as a state highway
    if matched_municipal_id and road_type != "state_highway":
        auth = AUTHORITIES[matched_municipal_id].copy()
        auth["confidence"] = "high"
        auth["reason"] = f"Location matches verified municipal jurisdiction for {auth['name']} ({matched_term.title()} city/suburban limits)."
        auth["requires_user_choice"] = False
        return auth

    # Rule 3: State PWD region based on verified district (e.g., Maharashtra)
    if "maharashtra" in clean_state or not clean_state:
        for dist_term, pwd_id in DISTRICT_TO_PWD.items():
            if dist_term in clean_district or dist_term in clean_city:
                auth = AUTHORITIES[pwd_id].copy()
                auth["confidence"] = "medium"
                auth["reason"] = f"Location falls in {dist_term.title()} district. State highways and major district roads are managed by {auth['name']}."
                auth["requires_user_choice"] = False
                return auth

    # Rule 4: Ambiguous or unknown location
    fallback_auth = AUTHORITIES["aaple_sarkar"].copy() if "maharashtra" in clean_state else AUTHORITIES["cpgrams_central"].copy()
    fallback_auth["confidence"] = "low"
    fallback_auth["reason"] = "Authority could not be inferred confidently from coordinates. Please confirm the jurisdiction or choose from the list."
    fallback_auth["requires_user_choice"] = True
    return fallback_auth


def get_available_authorities() -> List[Dict[str, Any]]:
    """Returns the full list of selectable authorities for the frontend dropdown."""
    return list(AUTHORITIES.values())
