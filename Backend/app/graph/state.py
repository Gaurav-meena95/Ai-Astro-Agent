from typing import TypedDict, List, Optional, Dict, Any
from langchain_core.messages import BaseMessage

class UserProfileState(TypedDict):
    lat: float
    lng: float
    timezone_id: str
    birth_date: str
    birth_time: str
    birth_place: str
    placements: Dict[str, Any]
    houses: Dict[str, Any]

class AgentState(TypedDict):
    messages: List[BaseMessage]
    user_profile: Optional[UserProfileState]
    transit_data: Optional[Dict[str, Any]]
    retrieved_docs: List[str]
    system_error: Optional[str]
