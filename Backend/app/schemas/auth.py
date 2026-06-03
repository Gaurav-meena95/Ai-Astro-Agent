from pydantic import BaseModel, Field

class UserAuthRequest(BaseModel):
    """
    Standard request payload for both register and login actions.
    Uses generic validation string matching to avoid email-validator dependency crashes.
    """
    email: str = Field(..., pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$", description="Valid email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")

class AuthResponse(BaseModel):
    token: str
    email: str
    user_id: str
