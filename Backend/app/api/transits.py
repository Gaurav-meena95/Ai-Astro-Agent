import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_database
from app.api.auth import get_current_user
from app.services.astrology import get_daily_transits

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/transits", tags=["Daily Transits"])

@router.get("/daily")
async def fetch_daily_transits(current_user: dict = Depends(get_current_user)):
    """
    Computes and returns active daily transit alignments based on the user's birth coordinates.
    """
    db = get_database()
    user_id = str(current_user["_id"])
    
    # 1. Fetch user's profile to extract latitude/longitude
    profile = await db["profiles"].find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Birth details not found. Please complete profile configuration first."
        )
        
    try:
        # 2. Compute transits for today
        today_str = date.today().strftime("%Y-%m-%d")
        transit_data = get_daily_transits(
            today_str,
            profile["latitude"],
            profile["longitude"],
            profile["timezone_id"]
        )
        
        return {
            "success": True,
            "date": today_str,
            "transits": transit_data["placements"]
        }
    except Exception as e:
        logger.error(f"Failed to calculate transits: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compute transit alignments."
        )
