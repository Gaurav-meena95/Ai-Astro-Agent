import requests
from timezonefinder import TimezoneFinder

# Pre-defined offline city catalog exactly as requested
OFFLINE_CITIES = {
    "new delhi": {"lat": 28.6139, "lng": 77.2090, "display": "New Delhi, India", "timezone": "Asia/Kolkata"},
    "delhi": {"lat": 28.6139, "lng": 77.2090, "display": "New Delhi, India", "timezone": "Asia/Kolkata"},
    "mumbai": {"lat": 19.0760, "lng": 72.8777, "display": "Mumbai, India", "timezone": "Asia/Kolkata"},
    "bangalore": {"lat": 12.9716, "lng": 77.5946, "display": "Bangalore, India", "timezone": "Asia/Kolkata"},
    "chennai": {"lat": 13.0827, "lng": 80.2707, "display": "Chennai, India", "timezone": "Asia/Kolkata"},
    "kolkata": {"lat": 22.5726, "lng": 88.3639, "display": "Kolkata, India", "timezone": "Asia/Kolkata"},
    "hyderabad": {"lat": 17.3850, "lng": 78.4867, "display": "Hyderabad, India", "timezone": "Asia/Kolkata"},
    "pune": {"lat": 18.5204, "lng": 73.8567, "display": "Pune, India", "timezone": "Asia/Kolkata"},
    "jaipur": {"lat": 26.9124, "lng": 75.7873, "display": "Jaipur, India", "timezone": "Asia/Kolkata"},
    "london": {"lat": 51.5074, "lng": -0.1278, "display": "London, UK", "timezone": "Europe/London"},
    "new york": {"lat": 40.7128, "lng": -74.0060, "display": "New York, USA", "timezone": "America/New_York"},
    "san francisco": {"lat": 37.7749, "lng": -122.4194, "display": "San Francisco, USA", "timezone": "America/Los_Angeles"},
    "los angeles": {"lat": 34.0522, "lng": -118.2437, "display": "Los Angeles, USA", "timezone": "America/Los_Angeles"},
    "chicago": {"lat": 41.8781, "lng": -87.6298, "display": "Chicago, USA", "timezone": "America/Chicago"},
    "tokyo": {"lat": 35.6762, "lng": 139.6503, "display": "Tokyo, Japan", "timezone": "Asia/Tokyo"},
    "sydney": {"lat": -33.8688, "lng": 151.2093, "display": "Sydney, Australia", "timezone": "Australia/Sydney"},
    "paris": {"lat": 48.8566, "lng": 2.3522, "display": "Paris, France", "timezone": "Europe/Paris"},
    "berlin": {"lat": 52.5200, "lng": 13.4050, "display": "Berlin, Germany", "timezone": "Europe/Berlin"},
    "toronto": {"lat": 43.6532, "lng": -79.3832, "display": "Toronto, Canada", "timezone": "America/Toronto"},
    "dubai": {"lat": 25.2048, "lng": 55.2708, "display": "Dubai, UAE", "timezone": "Asia/Dubai"},
    "singapore": {"lat": 1.3521, "lng": 103.8198, "display": "Singapore", "timezone": "Asia/Singapore"},
    "moscow": {"lat": 55.7558, "lng": 37.6173, "display": "Moscow, Russia", "timezone": "Europe/Moscow"},
    "beijing": {"lat": 39.9042, "lng": 116.4074, "display": "Beijing, China", "timezone": "Asia/Shanghai"}
}

def geocode_place(place_name: str) -> dict:
    """
    Geocodes a place name by checking an offline cache before falling back
    to OpenStreetMap Nominatim. Resolves the timezone ID.
    """
    # 1. Normalize input
    normalized = place_name.lower().strip()
    
    lat = None
    lng = None
    display_name = None
    timezone_id = None
    
    # 2. Exact match check
    if normalized in OFFLINE_CITIES:
        city_data = OFFLINE_CITIES[normalized]
        lat = city_data["lat"]
        lng = city_data["lng"]
        display_name = city_data["display"]
        timezone_id = city_data["timezone"]
        
    # 3. Fuzzy match check
    if lat is None:
        for key, city_data in OFFLINE_CITIES.items():
            if key in normalized or normalized in key:
                lat = city_data["lat"]
                lng = city_data["lng"]
                display_name = city_data["display"]
                timezone_id = city_data["timezone"]
                break
                
    # 4. OpenStreetMap Nominatim Fallback
    if lat is None:
        try:
            url = f"https://nominatim.openstreetmap.org/search?q={place_name}&format=json&limit=1"
            headers = {"User-Agent": "AstroAgent/1.0"}
            response = requests.get(url, headers=headers, timeout=3)
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    lat = float(data[0]["lat"])
                    lng = float(data[0]["lon"])
                    display_name = data[0]["display_name"]
        except Exception:
            pass

    # 5. Fail check
    if lat is None or lng is None:
        raise ValueError(f"Could not geocode place: {place_name}")

    # 6. Resolve timezone ID
    if timezone_id is None:
        try:
            tf = TimezoneFinder()
            timezone_id = tf.timezone_at(lat=lat, lng=lng)
        except Exception:
            pass
        if not timezone_id:
            timezone_id = "UTC"

    # 7. Return payload
    return {
        "lat": lat,
        "lng": lng,
        "display_name": display_name,
        "timezone_id": timezone_id
    }
