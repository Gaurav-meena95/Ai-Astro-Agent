import logging
import pytz
from datetime import datetime
from typing import Dict, Any, List

# These will be available once pip install task completes
from flatlib import const
from flatlib.chart import Chart
from flatlib.datetime import Datetime
from flatlib.geopos import GeoPos

logger = logging.getLogger(__name__)

PLANET_MAP = {
    const.SUN: "Sun",
    const.MOON: "Moon",
    const.MERCURY: "Mercury",
    const.VENUS: "Venus",
    const.MARS: "Mars",
    const.JUPITER: "Jupiter",
    const.SATURN: "Saturn",
    const.NORTH_NODE: "Rahu (North Node)",
    const.SOUTH_NODE: "Ketu (South Node)"
}

def get_utc_offset_str(date_str: str, time_str: str, timezone_id: str) -> str:
    """
    Computes timezone offset dynamically for the given date, time, and timezone ID.
    Handles historical adjustments and Daylight Saving Time (DST).
    Returns offset in flatlib format: '+HH:MM' or '-HH:MM'
    """
    try:
        tz = pytz.timezone(timezone_id)
        dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        localized_dt = tz.localize(dt)
        offset_seconds = localized_dt.utcoffset().total_seconds()
        
        offset_hours = int(offset_seconds // 3600)
        offset_minutes = int((abs(offset_seconds) % 3600) // 60)
        
        sign = "+" if offset_seconds >= 0 else "-"
        return f"{sign}{abs(offset_hours):02d}:{offset_minutes:02d}"
    except Exception as e:
        logger.error(f"Error calculating timezone offset for {timezone_id}: {e}. Defaulting to UTC (+00:00).")
        return "+00:00"

def compute_birth_chart(birth_date: str, birth_time: str, lat: float, lon: float, timezone_id: str) -> Dict[str, Any]:
    """
    Computes exact planetary placements and houses using flatlib.
    Includes robustness checks such as falling back to Equal Houses at high latitudes.
    """
    try:
        utcoffset = get_utc_offset_str(birth_date, birth_time, timezone_id)
        
        # Convert date to flatlib format: YYYY/MM/DD
        flatlib_date = birth_date.replace("-", "/")
        
        datetime_obj = Datetime(flatlib_date, birth_time, utcoffset)
        geopos_obj = GeoPos(lat, lon)
        
        # Placidus house system fails at extreme latitudes (>66 degrees).
        # We catch this case and fall back to Equal Houses.
        house_system = const.HOUSES_PLACIDUS
        if abs(lat) > 66.0:
            logger.warning(f"High latitude detected ({lat}). Falling back from Placidus to Equal house system.")
            house_system = const.HOUSES_EQUAL
            
        chart = Chart(datetime_obj, geopos_obj, hsys=house_system)
        
        # 1. Compute planetary coordinates
        placements = {}
        for p_id, p_name in PLANET_MAP.items():
            p = chart.get(p_id)
            house_obj = chart.houses.getObjectHouse(p)
            house_num = house_obj.num() if house_obj else 1
            placements[p_name] = {
                "planet": p_name,
                "sign": p.sign,
                "degree": round(p.signlon, 2),
                "house": house_num,
                "retrograde": p.isRetrograde()
            }
            
        # 2. Get Ascendant (first house cusp)
        asc = chart.houses.get('House1')
        placements["Ascendant"] = {
            "planet": "Ascendant",
            "sign": asc.sign,
            "degree": round(asc.signlon, 2),
            "house": 1,
            "retrograde": False
        }
        
        # 3. Get all house cusps
        houses = []
        for i in range(1, 13):
            h = chart.houses.get(f"House{i}")
            houses.append({
                "house": i,
                "sign": h.sign,
                "degree": round(h.signlon, 2)
            })
            
        return {
            "placements": placements,
            "houses": houses,
            "house_system": "Placidus" if house_system == const.HOUSES_PLACIDUS else "Equal"
        }
    except Exception as e:
        logger.error(f"Failed to compute birth chart: {e}", exc_info=True)
        raise ValueError(f"Birth chart calculation error: {str(e)}")

def get_daily_transits(current_date: str, lat: float, lon: float, timezone_id: str) -> Dict[str, Any]:
    """
    Computes current transit placements for a given date.
    Uses noon (12:00) as the reference time for transit movements.
    """
    # Simple transits at 12:00 noon
    return compute_birth_chart(
        birth_date=current_date,
        birth_time="12:00",
        lat=lat,
        lon=lon,
        timezone_id=timezone_id
    )
