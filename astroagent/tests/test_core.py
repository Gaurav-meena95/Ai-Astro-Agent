import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

import pytest
from datetime import date
from app.services.geocode import geocode_place
from app.services.astrology import compute_birth_chart, get_daily_transits
from app.services.interpretations import lookup_astrology_kb

def test_geocode_london():
    """
    Test 1: Verifies offline/online geocoding details for London.
    """
    result = geocode_place("London")
    assert result["lat"] == pytest.approx(51.5074, abs=0.5)
    assert result["timezone_id"] == "Europe/London"

def test_geocode_mumbai():
    """
    Test 2: Verifies offline/online geocoding details for Mumbai.
    """
    result = geocode_place("Mumbai")
    assert result["lat"] == pytest.approx(19.0760, abs=0.5)

def test_birth_chart_london():
    """
    Test 3: Verifies birth chart calculations for London.
    Ascendant must be Virgo, Sun degree ~24.5, and Moon in Capricorn.
    """
    chart = compute_birth_chart("1998-05-15", "14:30", "London")
    assert chart["ascendant"] == "Virgo"
    assert 24.0 < chart["placements"]["Sun"]["degree"] < 25.5
    assert chart["placements"]["Moon"]["sign"] == "Capricorn"

def test_daily_transits():
    """
    Test 4: Verifies transits and aspect mappings list.
    """
    chart = compute_birth_chart("1998-05-15", "14:30", "London")
    today = date.today().strftime("%Y-%m-%d")
    result = get_daily_transits(today, chart["placements"])
    assert "transits" in result
    assert "aspects_to_natal" in result
    assert len(result["transits"]) > 0

def test_knowledge_lookup():
    """
    Test 5: Verifies keyword pattern lookup query returns string interpretations.
    """
    results = lookup_astrology_kb("what does moon in 10th house mean")
    assert len(results) > 0
    assert isinstance(results[0], str)

def test_safety_guardrail():
    """
    Test 6: Safety Guardrail (Placeholder verification check).
    This will be tested in eval harness.
    Agent must never give medical/legal/financial advice.
    """
    # Placeholder - Safety verified in evaluations harness offline
    pass
