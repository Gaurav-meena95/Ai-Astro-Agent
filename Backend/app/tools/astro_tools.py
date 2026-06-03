import json
import logging
from langchain_core.tools import tool
from app.services.geocode import geocode_place as geocode_svc
from app.services.astrology import compute_birth_chart as compute_svc, get_daily_transits as transits_svc
from app.services.interpretations import lookup_astrology_kb as kb_svc

logger = logging.getLogger(__name__)

@tool
def geocode_place_tool(place_name: str) -> str:
    """
    Useful to convert a city/place name into precise coordinate parameters (Latitude, Longitude, and Timezone).
    Use this when the user mentions a birth location and you need coordinates to calculate their chart.
    Input format: e.g., 'London' or 'New Delhi, India'
    """
    try:
        data = geocode_svc(place_name)
        return json.dumps(data)
    except Exception as e:
        logger.error(f"Geocoding tool failed: {e}")
        return json.dumps({"error": str(e)})

@tool
def compute_birth_chart_tool(birth_date: str, birth_time: str, lat: float, lon: float, timezone_id: str) -> str:
    """
    Computes a complete birth chart containing planetary placements (Sun, Moon, Mercury, etc.) in signs and houses.
    Requires exact lat, lon, and timezone ID. Get these using geocode_place_tool first if not provided!
    Input format: birth_date='YYYY-MM-DD', birth_time='HH:MM' (24-hour), lat=float, lon=float, timezone_id='Region/City'
    """
    try:
        chart_data = compute_svc(birth_date, birth_time, lat, lon, timezone_id)
        return json.dumps(chart_data)
    except Exception as e:
        logger.error(f"Birth chart calculation tool failed: {e}")
        return json.dumps({"error": str(e)})

@tool
def get_daily_transits_tool(current_date: str, lat: float, lon: float, timezone_id: str) -> str:
    """
    Computes active daily planetary transits for a given date in relation to geographical coordinates.
    Useful when answering 'What are my transits today?' or 'Provide daily guidance'.
    Input format: current_date='YYYY-MM-DD', lat=float, lon=float, timezone_id='Region/City'
    """
    try:
        transit_data = transits_svc(current_date, lat, lon, timezone_id)
        return json.dumps(transit_data)
    except Exception as e:
        logger.error(f"Daily transit calculation tool failed: {e}")
        return json.dumps({"error": str(e)})

@tool
def knowledge_lookup_tool(query: str) -> str:
    """
    Useful to lookup classical astrological interpretations and principles from the knowledge base.
    Use this to retrieve explanations of what a planet in a sign or house represents (e.g., 'Sun in Aries' or 'Moon in 10th house').
    Input is a search keyword or phrase related to astrology.
    """
    try:
        result = kb_svc(query)
        return result
    except Exception as e:
        logger.error(f"Knowledge lookup tool failed: {e}")
        return f"Error loading interpretation: {str(e)}"
