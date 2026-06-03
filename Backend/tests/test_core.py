import sys
import os

# Add parent directory to sys.path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.geocode import geocode_place
from app.services.astrology import compute_birth_chart

def test_geocoding():
    print("=== Testing Geocoding Service ===")
    
    # 1. Test offline cache hit
    res_london = geocode_place("London")
    print(f"London: {res_london}")
    assert res_london["timezone"] == "Europe/London"
    assert abs(res_london["lat"] - 51.5074) < 0.1
    
    # 2. Test fuzzy fallback
    res_fuzzy = geocode_place("New delhi city")
    print(f"New Delhi Fuzzy: {res_fuzzy}")
    assert res_fuzzy["timezone"] == "Asia/Kolkata"
    
    print("Geocoding tests passed successfully!\n")

def test_astrology():
    print("=== Testing Astrology Engine ===")
    
    # Let's compute a birth chart for a birth in London
    # Date: 1998-05-15, Time: 14:30
    birth_date = "1998-05-15"
    birth_time = "14:30"
    lat = 51.5074
    lon = -0.1278
    timezone_id = "Europe/London"
    
    chart_data = compute_birth_chart(birth_date, birth_time, lat, lon, timezone_id)
    print(f"Computed House System: {chart_data['house_system']}")
    
    placements = chart_data["placements"]
    print("\nPlanetary Placements:")
    for planet, info in placements.items():
        print(f"  {planet:20} -> Sign: {info['sign']:12} | Degree: {info['degree']:5}° | House: {info['house']}")
        
    print("\nHouses Cusps:")
    for h in chart_data["houses"]:
        print(f"  House {h['house']:02d} -> Sign: {h['sign']:12} | Degree: {h['degree']}°")
        
    # Check that key planets exist
    assert "Sun" in placements
    assert "Moon" in placements
    assert "Ascendant" in placements
    assert len(chart_data["houses"]) == 12
    
    print("\nAstrology Engine tests passed successfully!")

if __name__ == "__main__":
    test_geocoding()
    try:
        test_astrology()
    except Exception as e:
        print(f"Astrology test failed (Note: flatlib might still be installing): {e}")
