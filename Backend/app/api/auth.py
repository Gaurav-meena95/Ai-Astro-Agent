from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from datetime import datetime
from jose import jwt
from bson import ObjectId
from app.core import config

router = APIRouter()
security = HTTPBearer()

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(request: SignupRequest):
    db = get_db()
    email_lower = request.email.lower()
    
    # Check if email already exists
    existing = await db.users.find_one({"email": email_lower})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Hash password and insert user
    hashed = hash_password(request.password)
    user_doc = {
        "username": request.username,
        "email": email_lower,
        "hashed_password": hashed,
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user_doc)
    inserted_id = result.inserted_id
    
    # Generate token
    token = create_access_token({"sub": str(inserted_id), "email": email_lower})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": request.username
    }

@router.post("/login")
async def login(request: LoginRequest):
    db = get_db()
    email_lower = request.email.lower()
    
    # Find user by email
    user = await db.users.find_one({"email": email_lower})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Verify password
    # In case previous schema was hashed_password or password_hash, handle hashed_password
    hashed_pass = user.get("hashed_password") or user.get("password_hash")
    if not hashed_pass or not verify_password(request.password, hashed_pass):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Generate token
    token = create_access_token({"sub": str(user["_id"]), "email": email_lower})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"]
    }

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    db = get_db()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None
        
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user
