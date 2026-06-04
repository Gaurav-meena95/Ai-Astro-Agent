from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.auth import get_current_user
from app.services.astrology import compute_birth_chart
from app.core.database import get_db
from datetime import datetime
from bson import ObjectId

router = APIRouter()

class BirthChartRequest(BaseModel):
    birth_date: str   # YYYY-MM-DD
    birth_time: str   # HH:MM
    birth_place: str

@router.post("/birth-chart")
async def create_birth_chart_profile(
    payload: BirthChartRequest,
    current_user = Depends(get_current_user)
):
    db = get_db()
    user_id = str(current_user["_id"])
    
    try:
        # Call compute_birth_chart(birth_date, birth_time, birth_place)
        chart = compute_birth_chart(
            payload.birth_date,
            payload.birth_time,
            payload.birth_place
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to compute birth chart: {str(e)}"
        )
        
    profile_doc = {
        "user_id": user_id,
        "birth_date": payload.birth_date,
        "birth_time": payload.birth_time,
        "birth_place": payload.birth_place,
        "lat": chart["location"]["lat"],
        "lng": chart["location"]["lng"],
        "timezone_id": chart["location"]["timezone_id"],
        "placements": chart["placements"],
        "houses": chart["houses"],
        "ascendant": chart["ascendant"],
        "created_at": datetime.utcnow()
    }
    
    # Upsert into db.profiles (filter by user_id, replace if exists)
    await db.profiles.replace_one(
        {"user_id": user_id},
        profile_doc,
        upsert=True
    )
    
    # Retrieve the upserted profile document to get and serialize the ObjectId
    db_profile = await db.profiles.find_one({"user_id": user_id})
    if db_profile:
        db_profile["_id"] = str(db_profile["_id"])
        
    return db_profile

@router.get("")
async def get_profile(current_user = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])
    
    profile_doc = await db.profiles.find_one({"user_id": user_id})
    if not profile_doc:
        return {"profile": None}
        
    profile_doc["_id"] = str(profile_doc["_id"])
    return {"profile": profile_doc}
