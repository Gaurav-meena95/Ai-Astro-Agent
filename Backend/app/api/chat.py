from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.api.auth import get_current_user
from app.agent.graph import agent_graph
from app.core.database import get_db
from langchain_core.messages import HumanMessage, AIMessage
from datetime import datetime
from bson import ObjectId
import json
import asyncio
from typing import Optional

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

async def stream_response(message: str, session_id: Optional[str], current_user, db):
    # 1. Load or create session
    user_id = str(current_user["_id"])
    
    if session_id:
        try:
            session = await db.sessions.find_one({"_id": ObjectId(session_id), "user_id": user_id})
        except Exception:
            session = None
    else:
        session = None
        
    if not session:
        session = {
            "user_id": user_id,
            "messages": [],
            "title": message[:50],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.sessions.insert_one(session)
        session["_id"] = result.inserted_id
        session_id = str(result.inserted_id)
        
    # 2. Load user profile from db
    profile = await db.profiles.find_one({"user_id": user_id})
    user_profile = None
    if profile:
        user_profile = {
            "lat": profile["lat"],
            "lng": profile["lng"],
            "timezone_id": profile["timezone_id"],
            "birth_date": profile["birth_date"],
            "birth_time": profile["birth_time"],
            "birth_place": profile["birth_place"],
            "placements": profile["placements"],
            "houses": profile["houses"],
            "ascendant": profile.get("ascendant")
        }
        
    # 3. Build message history from session
    history = []
    for msg in session.get("messages", []):
        if msg["role"] == "human":
            history.append(HumanMessage(content=msg["content"]))
        else:
            history.append(AIMessage(content=msg["content"]))
    history.append(HumanMessage(content=message))
    
    # 4. Build agent state
    state = {
        "messages": history,
        "user_profile": user_profile,
        "transit_data": None,
        "retrieved_docs": [],
        "system_error": None
    }
    
    # 5. Send session_id first
    yield f"data: {json.dumps({'session_id': session_id})}\n\n"
    
    # 6. Stream agent response
    full_response = ""
    
    try:
        async for event in agent_graph.astream_events(state, version="v1"):
            if event["event"] == "on_chain_start":
                node_name = event.get("name")
                if node_name in ["natal_engine", "transit_engine", "kb_lookup", "agent_synthesizer"]:
                    yield f"data: {json.dumps({'node': node_name})}\n\n"
            elif event["event"] == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, "content") and chunk.content:
                    full_response += chunk.content
                    yield f"data: {json.dumps({'text': chunk.content})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
    # 7. Save messages to session
    session_messages = session.get("messages", [])
    session_messages.append({"role": "human", "content": message})
    session_messages.append({"role": "ai", "content": full_response})
    
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {"$set": {
            "messages": session_messages,
            "updated_at": datetime.utcnow()
        }}
    )
    
    yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"

@router.post("/send")
async def send_message(
    request: ChatRequest,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    return StreamingResponse(
        stream_response(request.message, request.session_id, current_user, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/sessions")
async def get_sessions(
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    user_id = str(current_user["_id"])
    cursor = db.sessions.find({"user_id": user_id}).sort([("updated_at", -1), ("created_at", -1)]).limit(20)
    sessions = []
    async for s in cursor:
        created_at_val = s.get("created_at")
        updated_at_val = s.get("updated_at") or created_at_val
        
        sessions.append({
            "id": str(s["_id"]),
            "title": s.get("title", "Untitled"),
            "created_at": created_at_val.isoformat() if isinstance(created_at_val, datetime) else str(created_at_val),
            "updated_at": updated_at_val.isoformat() if isinstance(updated_at_val, datetime) else str(updated_at_val)
        })
    return sessions

@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db)
):
    user_id = str(current_user["_id"])
    try:
        session = await db.sessions.find_one({"_id": ObjectId(session_id), "user_id": user_id})
    except Exception:
        session = None
        
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session["_id"] = str(session["_id"])
    return session
