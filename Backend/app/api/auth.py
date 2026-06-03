import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from app.core.security import hash_password, verify_password, create_jwt_token, decode_jwt_token
from app.core.database import get_database
from app.schemas.auth import UserAuthRequest, AuthResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

security_bearer = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)):
    """
    FastAPI security dependency to retrieve the authorized user from the Bearer Token.
    Returns the user document or raises 401 Unauthorized.
    """
    token = credentials.credentials
    user_id = decode_jwt_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token"
        )
        
    db = get_database()
    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorized user could not be found"
        )
    return user

@router.post("/signup", response_model=AuthResponse)
async def signup(payload: UserAuthRequest):
    """
    Registers a new user and returns a session JWT.
    """
    db = get_database()
    
    # Check if user already exists
    existing_user = await db["users"].find_one({"email": payload.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
        
    hashed = hash_password(payload.password)
    user_doc = {
        "email": payload.email.lower(),
        "password_hash": hashed
    }
    
    try:
        result = await db["users"].insert_one(user_doc)
        user_id = str(result.inserted_id)
        token = create_jwt_token(user_id)
        return {
            "token": token,
            "email": payload.email.lower(),
            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Signup database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not complete user registration due to database error"
        )

@router.post("/login", response_model=AuthResponse)
async def login(payload: UserAuthRequest):
    """
    Authenticates a user, verifies credentials, and returns a new session JWT.
    """
    db = get_database()
    
    user = await db["users"].find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password credentials provided"
        )
        
    user_id = str(user["_id"])
    token = create_jwt_token(user_id)
    return {
        "token": token,
        "email": user["email"],
        "user_id": user_id
    }
