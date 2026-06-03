import json
import logging
from datetime import date
from typing import Dict, Any, List
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq

from app.graph.state import AgentState
from app.services.interpretations import get_placement_interpretation, lookup_astrology_kb
from app.services.astrology import compute_birth_chart, get_daily_transits
from app.services.geocode import geocode_place

logger = logging.getLogger(__name__)

# Initialize LLM using the same credentials as in services/llm.py
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.3
)

def should_route(state: AgentState) -> str:
    """
    Analyzes the latest user message to route the query to specific context nodes.
    Returns: 'natal_engine' | 'transit_engine' | 'kb_lookup' | 'agent_synthesizer'
    """
    messages = state.get("messages", [])
    if not messages:
        return "agent_synthesizer"
        
    last_msg = messages[-1].content.lower()
    
    # 1. Route to natal engine if birth info is mentioned but profile is empty
    if not state.get("user_profile"):
        if any(keyword in last_msg for keyword in ["birth", "born", "chart", "natal", "ascendant"]):
            return "natal_engine"
            
    # 2. Route to transit engine for transit questions
    if any(keyword in last_msg for keyword in ["transit", "today", "current alignment", "daily guidance"]):
        return "transit_engine"
        
    # 3. Route to KB lookup for theoretical questions
    if any(keyword in last_msg for keyword in ["what does", "explain", "house meaning", "compatibility", "aspect"]):
        return "kb_lookup"
        
    return "agent_synthesizer"

def natal_engine_node(state: AgentState) -> Dict[str, Any]:
    """
    Attempts to extract birth details from the conversation history,
    computes coordinates, calculates the birth chart, and updates the state.
    """
    messages = state.get("messages", [])
    if not messages:
        return {"system_error": "No message history found in natal node."}
        
    # System call to extract birth parameters (Date, Time, Place) in structured JSON
    extraction_prompt = (
        "Extract birth details from the following conversation history. "
        "Return ONLY a clean JSON object. Do not include markdown formatting or explanations.\n"
        "Required keys: birth_date (YYYY-MM-DD), birth_time (HH:MM), birth_place (String).\n"
        "If a parameter is missing, output null for that key.\n\n"
        f"History:\n{[m.content for m in messages[-3:]]}"
    )
    
    try:
        extraction_res = llm.invoke([SystemMessage(content=extraction_prompt)])
        data = json.loads(extraction_res.content.strip())
        
        # Check if all keys exist and are not null
        if data.get("birth_date") and data.get("birth_place"):
            birth_time = data.get("birth_time") or "12:00" # Fallback to noon if time is missing
            
            # Geocode
            geo = geocode_place(data["birth_place"])
            
            # Calculate Chart
            chart = compute_birth_chart(
                data["birth_date"],
                birth_time,
                geo["lat"],
                geo["lon"],
                geo["timezone"]
            )
            
            profile = {
                "user_id": None,
                "birth_date": data["birth_date"],
                "birth_time": birth_time,
                "birth_place": data["birth_place"],
                "latitude": geo["lat"],
                "longitude": geo["lon"],
                "timezone_id": geo["timezone"],
                "natal_placements": chart["placements"],
                "houses": chart["houses"]
            }
            logger.info("Natal engine successfully computed chart details via conversation.")
            return {"user_profile": profile}
    except Exception as e:
        logger.warning(f"Natal engine node extraction or calculation failed: {e}")
        
    return {"system_error": "Could not compute birth chart. Please provide birth date (YYYY-MM-DD), time (HH:MM), and place."}

def transit_engine_node(state: AgentState) -> Dict[str, Any]:
    """
    Computes transits for the current date based on the user's geocoded location and birth coordinates.
    """
    profile = state.get("user_profile")
    if not profile:
        return {"system_error": "Cannot calculate transits without a birth chart. Please complete onboarding first."}
        
    try:
        today_str = date.today().strftime("%Y-%m-%d")
        transits = get_daily_transits(
            today_str,
            profile["latitude"],
            profile["longitude"],
            profile["timezone_id"]
        )
        return {"transit_data": transits}
    except Exception as e:
        logger.error(f"Transit calculations failed: {e}")
        return {"system_error": f"Transit calculations error: {str(e)}"}

def kb_lookup_node(state: AgentState) -> Dict[str, Any]:
    """
    Retrieves classical astrology definitions matching the user's latest query.
    """
    messages = state.get("messages", [])
    if not messages:
        return {"retrieved_docs": []}
        
    query = messages[-1].content
    docs = lookup_astrology_kb(query)
    return {"retrieved_docs": [docs]}

def agent_synthesizer_node(state: AgentState) -> Dict[str, Any]:
    """
    Compiles full astronomical coordinates, aspects, transits, RAG logs, and memory context
    to formulate a professional, grounded, and safe astrological response.
    """
    profile = state.get("user_profile")
    transits = state.get("transit_data")
    kb_docs = state.get("retrieved_docs", [])
    system_error = state.get("system_error")
    
    # 1. Initialize core system message
    system_instruction = (
        "You are AstroAgent, an empathetic, highly professional, and scientifically grounded Vedic astrology assistant.\n"
        "Your goal is to guide the user accurately and safely based on their actual astronomical placements.\n\n"
        "IMPORTANT RULES:\n"
        "1. Never diagnose health conditions, prescribe medical actions, or give legal/extreme financial advice. Safely defer to professionals.\n"
        "2. Do not hallucinate planetary positions. If birth details are not provided or loaded, guide the user to input them.\n"
        "3. Keep your tone compassionate, therapeutic, and grounded. Explain astrological placements as spiritual and psychological tendencies, not rigid fate.\n\n"
    )
    
    # 2. Inject Birth Chart contexts if available
    if profile:
        placements_str = "\n".join([
            f"- {p}: {info['sign']} at {info['degree']}°, House {info['house']} {'(Retrograde)' if info['retrograde'] else ''}"
            for p, info in profile["natal_placements"].items()
        ])
        
        # Pull pre-computed interpretations for their exact placements
        interpretations = []
        for p, info in profile["natal_placements"].items():
            if p in ["Sun", "Moon", "Mars"]:
                interp = get_placement_interpretation(p, info["sign"], info["house"])
                interpretations.append(interp)
                
        system_instruction += (
            f"USER BIRTH CHART DETAILS:\n"
            f"Birth Date: {profile['birth_date']}\n"
            f"Birth Time: {profile['birth_time']}\n"
            f"Birth Location: {profile['birth_place']}\n"
            f"Planetary Placements:\n{placements_str}\n\n"
            f"GUIDED INTERPRETATION BLUEPRINT:\n"
            f"{chr(10).join(interpretations)}\n\n"
        )
        
    # 3. Inject Transit context if available
    if transits:
        transit_placements = transits.get("placements", {})
        transits_str = "\n".join([
            f"- {p}: Transiting {info['sign']} at {info['degree']}°"
            for p, info in transit_placements.items() if p in ["Sun", "Moon", "Mars", "Jupiter", "Saturn"]
        ])
        system_instruction += (
            f"ACTIVE TRANSITS TODAY:\n{transits_str}\n\n"
        )
        
    # 4. Inject retrieved general knowledge
    if kb_docs:
        system_instruction += (
            f"ADDITIONAL ASTROLOGICAL REFERENCE INFO:\n"
            f"{chr(10).join(kb_docs)}\n\n"
        )
        
    # 5. Inject systems errors if user needs onboarding guidance
    if system_error:
        system_instruction += (
            f"SYSTEM NOTIFICATION:\n{system_error}\n"
            "Instruct the user on how they can complete their onboarding or input their birth details.\n\n"
        )
        
    # Compile messages list
    messages_payload = [SystemMessage(content=system_instruction)] + state["messages"]
    
    # Run Inference
    response = llm.invoke(messages_payload)
    
    # Append the new AI response message to the state's message list
    return {"messages": [response], "system_error": None} # Clear temporary system errors
