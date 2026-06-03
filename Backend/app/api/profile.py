import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_database
from app.api.auth import get_current_user
from app.schemas.profile import BirthChartRequest
from app.services.geocode import geocode_place
from app.services.astrology import compute_birth_chart

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/profile", tags=["Profile & Astrology"])

@router.post("/birth-chart")
async def create_birth_chart(payload: BirthChartRequest, current_user: dict = Depends(get_current_user)):
    """
    Geocodes the location, computes coordinates, calculates the natal placements,
    and caches the resulting birth chart inside the user profile collection.
    """
    db = get_database()
    user_id = str(current_user["_id"])
    
    # 1. Geocode location parameters
    geo_data = geocode_place(payload.birth_place)
    
    try:
        # 2. Compute exact natal positions using flatlib
        chart_data = compute_birth_chart(
            payload.birth_date,
            payload.birth_time,
            geo_data["lat"],
            geo_data["lon"],
            geo_data["timezone"]
        )
        
        # 3. Compile full profile document
        profile_doc = {
            "user_id": user_id,
            "birth_date": payload.birth_date,
            "birth_time": payload.birth_time,
            "birth_place": payload.birth_place,
            "latitude": geo_data["lat"],
            "longitude": geo_data["lon"],
            "timezone_id": geo_data["timezone"],
            "display_name": geo_data["display_name"],
            "natal_chart": chart_data["placements"],
            "houses": chart_data["houses"]
        }
        
        # 4. Upsert profile in DB
        await db["profiles"].update_one(
            {"user_id": user_id},
            {"$set": profile_doc},
            upsert=True
        )
        
        return {
            "success": True,
            "profile": profile_doc
        }
    except Exception as e:
        logger.error(f"Failed to create user profile birth chart: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not compute birth chart alignments: {str(e)}"
        )

@router.get("")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Retrieves the cached profile and computed natal chart placements for the authorized user.
    """
    db = get_database()
    user_id = str(current_user["_id"])
    
    profile = await db["profiles"].find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Birth profile has not been configured yet. Please complete onboarding first."
        )
        
    # Serialize MongoDB ObjectId reference
    profile["_id"] = str(profile["_id"])
    return profile
