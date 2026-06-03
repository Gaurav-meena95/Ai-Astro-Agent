from pydantic import BaseModel

class ChatPayload(BaseModel):
    """
    Standard incoming chat message payload payload validating input message and active session references.
    """
    session_id: str
    message: str
