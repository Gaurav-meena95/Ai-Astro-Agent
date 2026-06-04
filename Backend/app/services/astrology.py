import pytz
from datetime import datetime
from flatlib import const
from flatlib.datetime import Datetime
from flatlib.geopos import GeoPos
from flatlib.chart import Chart
from app.services.geocode import geocode_place

# Standard Zodiac Signs order for absolute longitude conversion
ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

PLANET_MAP = {
    "Sun": const.SUN,
    "Moon": const.MOON,
    "Mercury": const.MERCURY,
    "Venus": const.VENUS,
    "Mars": const.MARS,
    "Jupiter": const.JUPITER,
    "Saturn": const.SATURN,
    "Rahu": const.NORTH_NODE,
    "Ketu": const.SOUTH_NODE
}

def get_utc_offset_str(date_str: str, time_str: str, timezone_id: str) -> str:
    """
    Computes timezone offset dynamically for the given date, time, and timezone ID.
    Returns offset in flatlib format: '+HH:MM' or '-HH:MM'
    """
    tz = pytz.timezone(timezone_id)
    dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    localized_dt = tz.localize(dt)
    offset_seconds = localized_dt.utcoffset().total_seconds()
    hours = int(offset_seconds // 3600)
    minutes = int(abs(offset_seconds % 3600) // 60)
    sign = "+" if hours >= 0 else "-"
    return f"{sign}{abs(hours):02d}:{minutes:02d}"

def compute_birth_chart(date_str: str, time_str: str, place_name: str) -> dict:
    """
    Geocodes location, computes local UTC offset, and builds a flatlib Chart.
    Extracts planetary placements, house cusps, and ascendant sign.
    """
    # 1. Geocode location
    loc = geocode_place(place_name)
    lat = loc["lat"]
    lng = loc["lng"]
    display_name = loc["display_name"]
    timezone_id = loc["timezone_id"]
    
    # 2. Get UTC offset
    utcoffset = get_utc_offset_str(date_str, time_str, timezone_id)
    
    # 3. Create flatlib Date and GeoPos objects
    date = Datetime(date_str.replace("-", "/"), time_str, utcoffset)
    pos = GeoPos(lat, lng)
    
    # 4. House system selection
    house_system = const.HOUSES_PLACIDUS
    if abs(lat) > 66.0:
        house_system = const.HOUSES_EQUAL
        
    # 5. Create Chart
    chart = Chart(date, pos, hsys=house_system)
    
    # 6. Extract placements dict for all 9 planets
    placements = {}
    for p_name, p_const in PLANET_MAP.items():
        p = chart.getObject(p_const)
        sign = p.sign
        degree = round(p.lon % 30, 2)
        house_obj = chart.houses.getObjectHouse(p)
        house_num = house_obj.num() if house_obj else 1
        placements[p_name] = {
            "sign": sign,
            "degree": degree,
            "house": house_num
        }
        
    # 7. Extract ascendant
    asc = chart.houses.get('House1')
    ascendant_sign = asc.sign
    
    # 8. Extract house cusps dict
    houses = {}
    for i in range(1, 13):
        h = chart.houses.get(f"House{i}")
        houses[f"House{i}"] = {
            "sign": h.sign,
            "degree": round(h.lon % 30, 2)
        }
        
    # 9. Return computed chart payload
    return {
        "placements": placements,
        "houses": houses,
        "ascendant": ascendant_sign,
        "location": {
            "lat": lat,
            "lng": lng,
            "display_name": display_name,
            "timezone_id": timezone_id
        }
    }

def get_daily_transits(date_str: str, natal_placements: dict) -> dict:
    """
    Computes global daily transits for a given date and returns
    aspects (conjunction, trine, square, opposition) compared to natal placements within an 8° orb.
    """
    # 1. Compute today's chart (transits are global: lat=0, lng=0, utcoffset=+00:00)
    transit_date = Datetime(date_str.replace("-", "/"), "12:00", "+00:00")
    transit_pos = GeoPos(0.0, 0.0)
    transit_chart = Chart(transit_date, transit_pos)
    
    # 2. Extract transit planet data
    transits = {}
    transit_longitudes = {}
    for p_name, p_const in PLANET_MAP.items():
        p = transit_chart.getObject(p_const)
        transits[p_name] = {
            "sign": p.sign,
            "degree": round(p.lon % 30, 2)
        }
        transit_longitudes[p_name] = p.lon
        
    # 3. Check aspects to natal planets
    aspects_to_natal = []
    
    # Helper to convert natal sign and degree to absolute longitude
    def get_natal_abs_lon(planet_data: dict) -> float:
        sign = planet_data["sign"]
        degree = planet_data["degree"]
        sign_idx = ZODIAC_SIGNS.index(sign)
        return sign_idx * 30 + degree

    for t_name, t_lon in transit_longitudes.items():
        for n_name, n_data in natal_placements.items():
            n_lon = get_natal_abs_lon(n_data)
            
            # Calculate orb (minimal angular distance on 360° circle)
            orb = abs(t_lon - n_lon)
            if orb > 180:
                orb = 360 - orb
                
            aspect = None
            aspect_orb = 0.0
            
            # Conjunction (0°)
            if orb <= 8:
                aspect = "CONJUNCTION"
                aspect_orb = round(orb, 2)
            # Trine (120°)
            elif abs(orb - 120) <= 8:
                aspect = "TRINE"
                aspect_orb = round(abs(orb - 120), 2)
            # Square (90°)
            elif abs(orb - 90) <= 8:
                aspect = "SQUARE"
                aspect_orb = round(abs(orb - 90), 2)
            # Opposition (180°)
            elif abs(orb - 180) <= 8:
                aspect = "OPPOSITION"
                aspect_orb = round(abs(orb - 180), 2)
                
            if aspect:
                aspects_to_natal.append({
                    "transit_planet": t_name,
                    "natal_planet": n_name,
                    "aspect": aspect,
                    "orb": aspect_orb
                })
                
    return {
        "date": date_str,
        "transits": transits,
        "aspects_to_natal": aspects_to_natal
    }
