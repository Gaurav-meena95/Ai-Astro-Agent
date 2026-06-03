from typing import TypedDict, List, Dict, Any, Optional
from langchain_core.messages import BaseMessage

class NatalPlacementState(TypedDict):
    planet: str
    sign: str
    degree: float
    house: int
    retrograde: bool

class UserProfileState(TypedDict):
    user_id: Optional[str]
    birth_date: str            # YYYY-MM-DD
    birth_time: str            # HH:MM
    birth_place: str
    latitude: float
    longitude: float
    timezone_id: str
    natal_placements: Dict[str, NatalPlacementState]
    houses: List[Dict[str, Any]]

class AgentState(TypedDict):
    messages: List[BaseMessage]
    user_profile: Optional[UserProfileState]
    transit_data: Optional[Dict[str, Any]]
    retrieved_docs: List[str]
    system_error: Optional[str]
