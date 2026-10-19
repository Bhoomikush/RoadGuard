import os
import logging
from typing import Dict, Any, Optional
import httpx
from .authority_service import pick_authority, get_available_authorities

logger = logging.getLogger(__name__)

# Configurable geocoding provider
# Defaults to OpenStreetMap Nominatim with a compliant User-Agent
NOMINATIM_BASE_URL = os.environ.get("GEOCODING_API_URL", "https://nominatim.openstreetmap.org/reverse")
USER_AGENT = os.environ.get("GEOCODING_USER_AGENT", "RoadGuard-CitizenReporting/1.0 (contact@roadguard.internal)")


def validate_coordinates(lat: float, lng: float) -> bool:
    """Validates that latitude and longitude fall within geographical limits."""
    if lat is None or lng is None:
        return False
    if not (-90.0 <= lat <= 90.0):
        return False
    if not (-180.0 <= lng <= 180.0):
        return False
    return True


async def reverse_geocode(lat: float, lng: float) -> Dict[str, Any]:
    """
    Reverse-geocodes coordinates into a human-readable address and suggests the responsible authority.
    Respects provider limits and does not expose keys or sensitive endpoints.
    """
    if not validate_coordinates(lat, lng):
        raise ValueError(f"Invalid coordinates: latitude={lat}, longitude={lng}. Expected -90<=lat<=90, -180<=lng<=180.")

    address_info: Dict[str, Any] = {
        "display_name": f"Coordinates: {lat:.6f}, {lng:.6f}",
        "road": "",
        "suburb": "",
        "city": "",
        "district": "",
        "state": "",
        "postcode": "",
        "country": "India",
        "latitude": lat,
        "longitude": lng,
        "map_link": f"https://www.google.com/maps?q={lat:.6f},{lng:.6f}",
        "is_geocoded": False
    }

    try:
        params = {
            "lat": lat,
            "lon": lng,
            "format": "jsonv2",
            "addressdetails": 1,
            "zoom": 18
        }
        headers = {
            "User-Agent": USER_AGENT,
            "Accept-Language": "en,hi,mr"
        }

        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(NOMINATIM_BASE_URL, params=params, headers=headers)
            if response.status_code == 200:
                data = response.json()
                raw_addr = data.get("address", {})

                road = raw_addr.get("road") or raw_addr.get("highway") or raw_addr.get("pedestrian") or ""
                suburb = raw_addr.get("suburb") or raw_addr.get("neighbourhood") or raw_addr.get("residential") or ""
                city = raw_addr.get("city") or raw_addr.get("town") or raw_addr.get("municipality") or raw_addr.get("village") or ""
                district = raw_addr.get("state_district") or raw_addr.get("county") or raw_addr.get("district") or ""
                state = raw_addr.get("state") or ""
                postcode = raw_addr.get("postcode") or ""
                display_name = data.get("display_name") or address_info["display_name"]

                address_info.update({
                    "display_name": display_name,
                    "road": road,
                    "suburb": suburb,
                    "city": city,
                    "district": district,
                    "state": state,
                    "postcode": postcode,
                    "is_geocoded": True
                })
            else:
                logger.warning(f"Geocoding service returned HTTP {response.status_code}")
    except httpx.TimeoutException:
        logger.warning(f"Geocoding request timed out for coordinates ({lat}, {lng})")
    except Exception as e:
        logger.warning(f"Geocoding request failed: {e}")

    # Pick recommended authority based on reverse geocoded details
    suggested_auth = pick_authority(
        city=address_info.get("city"),
        district=address_info.get("district"),
        road_type="national_highway" if address_info.get("road", "").upper().startswith("NH") else None,
        road_name=address_info.get("road"),
        state=address_info.get("state")
    )

    address_info["suggested_authority"] = suggested_auth
    address_info["available_authorities"] = get_available_authorities()

    return address_info
