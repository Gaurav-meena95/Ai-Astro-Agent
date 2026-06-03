from pydantic import BaseModel, Field

class BirthChartRequest(BaseModel):
    """
    Standard request payload containing validation patterns for birth chart onboarding.
    """
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="YYYY-MM-DD format")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM in 24-hour format")
    birth_place: str = Field(..., min_length=2, description="City/Country name of birth")
