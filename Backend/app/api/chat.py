import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from bson import ObjectId
from langchain_core.messages import HumanMessage, AIMessage

from app.core.database import get_database
from app.api.auth import get_current_user
from app.schemas.chat import ChatPayload
from app.agent.graph import agent_graph

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat & Conversations"])

@router.get("/sessions")
async def list_chat_sessions(current_user: dict = Depends(get_current_user)):
    """
    Lists all chat sessions created by the authorized user.
    """
    db = get_database()
    user_id = str(current_user["_id"])
    
    cursor = db["sessions"].find({"user_id": user_id}).sort("created_at", -1)
    sessions = []
    async for s in cursor:
        sessions.append({
            "session_id": str(s["_id"]),
            "title": s.get("title", "New Astrology Consultation"),
            "created_at": s["created_at"].isoformat() if isinstance(s["created_at"], datetime) else str(s["created_at"])
        })
    return sessions

@router.post("/sessions")
async def create_chat_session(current_user: dict = Depends(get_current_user)):
    """
    Creates a new stateful chat session and returns the session_id.
    """
    db = get_database()
    user_id = str(current_user["_id"])
    
    session_doc = {
        "user_id": user_id,
        "title": "Astrology Consultation",
        "created_at": datetime.utcnow(),
        "messages": []
    }
    
    try:
        result = await db["sessions"].insert_one(session_doc)
        return {
            "success": True,
            "session_id": str(result.inserted_id),
            "title": session_doc["title"]
        }
    except Exception as e:
        logger.error(f"Failed to create chat session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize chat session in database"
        )

@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieves the chronological list of messages in a given chat session.
    """
    db = get_database()
    user_id = str(current_user["_id"])
    
    try:
        session = await db["sessions"].find_one({"_id": ObjectId(session_id), "user_id": user_id})
    except Exception:
        session = None
        
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session could not be found or access is unauthorized"
        )
        
    return session.get("messages", [])

@router.post("/send")
async def send_chat_message(payload: ChatPayload, current_user: dict = Depends(get_current_user)):
    """
    Submits a message to the LangGraph agent state machine, streams the generated
    tokens in real-time via Server-Sent Events (SSE), and saves the results to MongoDB.
    """
    db = get_database()
    user_id = str(current_user["_id"])
    
    # 1. Fetch Session
    try:
        session = await db["sessions"].find_one({"_id": ObjectId(payload.session_id), "user_id": user_id})
    except Exception:
        session = None
        
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
        
    # 2. Fetch Cached User Profile (if configured)
    profile = await db["profiles"].find_one({"user_id": user_id})
    mapped_profile = None
    if profile:
        mapped_profile = {
            "user_id": user_id,
            "birth_date": profile["birth_date"],
            "birth_time": profile["birth_time"],
            "birth_place": profile["birth_place"],
            "latitude": profile["latitude"],
            "longitude": profile["longitude"],
            "timezone_id": profile["timezone_id"],
            "natal_placements": profile["natal_chart"],
            "houses": profile["houses"]
        }
        
    # 3. Construct chronological message history for LangGraph state
    history = []
    for msg in session.get("messages", []):
        if msg["role"] == "user":
            history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            history.append(AIMessage(content=msg["content"]))
            
    # Append the new user turn
    new_user_message = HumanMessage(content=payload.message)
    history.append(new_user_message)
    
    # Define the dynamic async event generator for SSE
    async def sse_event_generator():
        # Prepare starting state dictionary for graph
        initial_state = {
            "messages": history,
            "user_profile": mapped_profile,
            "transit_data": None,
            "retrieved_docs": [],
            "system_error": None
        }
        
        full_ai_response = ""
        
        try:
            # Streams events from LangGraph
            # We filter for llm streaming tokens ('on_chat_model_stream')
            async for event in agent_graph.astream_events(initial_state, version="v2"):
                event_type = event.get("event")
                
                # Check for LLM token chunks
                if event_type == "on_chat_model_stream":
                    token = event["data"]["chunk"].content
                    if token:
                        full_ai_response += token
                        # Format as standard Server-Sent Event (SSE) data chunk
                        yield f"data: {json.dumps({'text': token})}\n\n"
                        
            # 4. Once streaming is successfully completed, persist both messages to MongoDB
            # Create user message document
            user_msg_doc = {
                "role": "user",
                "content": payload.message,
                "timestamp": datetime.utcnow()
            }
            # Create assistant response document
            ai_msg_doc = {
                "role": "assistant",
                "content": full_ai_response,
                "timestamp": datetime.utcnow()
            }
            
            # Update title dynamically on the first exchange
            update_fields = {"$push": {"messages": {"$each": [user_msg_doc, ai_msg_doc]}}}
            if len(session.get("messages", [])) == 0:
                update_fields["$set"] = {"title": payload.message[:35] + ("..." if len(payload.message) > 35 else "")}
                
            await db["sessions"].update_one(
                {"_id": ObjectId(payload.session_id)},
                update_fields
            )
            
            # Signal end of stream connection
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            logger.error(f"SSE Chat generation error: {e}", exc_info=True)
            yield f"data: {json.dumps({'error': 'Conversational calculation failed.'})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(sse_event_generator(), media_type="text/event-stream")
