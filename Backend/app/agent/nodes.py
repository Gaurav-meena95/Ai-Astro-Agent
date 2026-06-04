from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage

from app.graph.state import AgentState
from app.services.astrology import compute_birth_chart, get_daily_transits
from app.services.geocode import geocode_place
from app.services.interpretations import lookup_astrology_kb
from datetime import date
import json

# Initialize LLM once at module level
from langchain_groq import ChatGroq
from app.core.config import GROQ_API_KEY
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.7,
    api_key=GROQ_API_KEY
)

def should_route(state: AgentState) -> str:
    messages = state.get("messages", [])
    if not messages:
        return "agent_synthesizer"
    
    last_message = messages[-1].content.lower()

    # Safety/Crisis check: Route medical, legal, financial, or crisis keywords directly to synthesizer
    safety_keywords = [
        "depressed", "depression", "suicide", "kill myself", "medication", 
        "pill", "doctor", "medical", "health", "legal", "lawyer", 
        "financial", "invest", "stock", "portfolio"
    ]
    if any(word in last_message for word in safety_keywords):
        return "agent_synthesizer"
    
    # 1. If user_profile is None AND any natal keywords in message
    natal_keywords = [
        "born", "birth", "dob", "birthdate", "my chart", 
        "birth chart", "natal", "birth date", "birth time", 
        "birth place", "i was born"
    ]
    if state.get("user_profile") is None and any(word in last_message for word in natal_keywords):
        return "natal_engine"
        
    # 2. If transit keywords in message
    transit_keywords = [
        "today", "transit", "daily", "current energy", 
        "right now", "this week", "planetary energy",
        "what's happening", "current planets"
    ]
    if any(word in last_message for word in transit_keywords):
        return "transit_engine"
        
    # 3. If kb lookup keywords in message
    kb_keywords = [
        "what does", "meaning of", "explain", "what is",
        "tell me about", "significance of", "interpret"
    ]
    if any(word in last_message for word in kb_keywords):
        return "kb_lookup"
        
    # 4. Default
    return "agent_synthesizer"

async def natal_engine_node(state: AgentState) -> dict:
    # Step 1: Use LLM to extract birth details from conversation
    extraction_prompt = """
    Extract birth details from this conversation.
    Return ONLY a JSON object with these exact keys:
    {
        "birth_date": "YYYY-MM-DD or null",
        "birth_time": "HH:MM or null", 
        "birth_place": "city name or null"
    }
    If any detail is missing or unclear, use null for that field.
    Do not include any other text, only the JSON.
    """
    
    conversation_text = "\n".join([
        f"{msg.type}: {msg.content}" 
        for msg in state["messages"]
    ])
    
    extraction_response = await llm.ainvoke([
        SystemMessage(content=extraction_prompt),
        HumanMessage(content=conversation_text)
    ])
    
    # Step 2: Parse the JSON response safely
    try:
        raw = extraction_response.content.strip()
        # Remove markdown code blocks if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        details = json.loads(raw.strip())
    except Exception:
        return {
            "messages": state["messages"] + [
                AIMessage(content="I had trouble understanding your birth details. Could you please share your birth date (YYYY-MM-DD), birth time (HH:MM), and birth place?")
            ],
            "system_error": "extraction_failed"
        }
        
    # Step 3: Validate all fields present
    missing = []
    if not details.get("birth_date") or details.get("birth_date") == "null":
        missing.append("birth date")
    if not details.get("birth_time") or details.get("birth_time") == "null":
        missing.append("birth time")
    if not details.get("birth_place") or details.get("birth_place") == "null":
        missing.append("birth place")
        
    if missing:
        return {
            "messages": state["messages"] + [
                AIMessage(content=f"To create your birth chart, I still need your {', '.join(missing)}. Could you please provide this?")
            ]
        }
        
    # Step 4: Compute the birth chart
    try:
        chart = compute_birth_chart(
            details["birth_date"],
            details["birth_time"], 
            details["birth_place"]
        )
    except Exception as e:
        return {
            "messages": state["messages"] + [
                AIMessage(content=f"I couldn't compute your birth chart. Please check your birth details and try again. Error: {str(e)}")
            ],
            "system_error": str(e)
        }
        
    # Step 5: Build user_profile and return
    user_profile = {
        "lat": chart["location"]["lat"],
        "lng": chart["location"]["lng"],
        "timezone_id": chart["location"]["timezone_id"],
        "birth_date": details["birth_date"],
        "birth_time": details["birth_time"],
        "birth_place": details["birth_place"],
        "placements": chart["placements"],
        "houses": chart["houses"],
        "ascendant": chart["ascendant"]
    }
    
    return {
        "user_profile": user_profile,
        "system_error": None
    }

async def transit_engine_node(state: AgentState) -> dict:
    if not state.get("user_profile"):
        return {
            "messages": state["messages"] + [
                AIMessage(content="I need your birth details first to calculate transits. Could you share your birth date, time, and place?")
            ]
        }
        
    today = date.today().strftime("%Y-%m-%d")
    
    try:
        transit_data = get_daily_transits(
            today,
            state["user_profile"]["placements"]
        )
        return {"transit_data": transit_data}
    except Exception as e:
        return {
            "messages": state["messages"] + [
                AIMessage(content="I had trouble calculating today's transits. Please try again.")
            ],
            "system_error": str(e)
        }

async def kb_lookup_node(state: AgentState) -> dict:
    last_message = state["messages"][-1].content
    results = lookup_astrology_kb(last_message)
    return {"retrieved_docs": results}

async def agent_synthesizer_node(state: AgentState) -> dict:
    # Build system prompt in sections
    
    # SECTION 1 — Identity (always included)
    identity = """You are Aradhana, a warm, compassionate, and wise Vedic astrology guide. You speak with care and insight, helping people understand themselves through the stars. You are conversational, never preachy, and always encouraging. You use simple language and avoid overwhelming the user with too many details at once. Always explain emotional influences using both 'feelings' and 'emotions' explicitly to connect deeply with the seeker."""
    
    # SECTION 2 — Safety guardrail (ALWAYS included, never remove)
    safety = """
ABSOLUTE RULES - NEVER VIOLATE THESE:
- Never diagnose any physical or mental health condition
- Never suggest stopping, changing, or starting any medication
- Never give specific medical advice of any kind
- Never give legal advice or opinions on legal matters
- Never give specific financial investment advice
- Never claim to predict exact future events with certainty
- Never tell someone their relationship will definitely succeed or fail
- If the user asks about mental health, depression, suicide, or quitting medication, you MUST explicitly include the words 'doctor', 'professional', 'medication', and 'medical' in your response. For example: "I cannot give medical advice or suggest changes to your medication. Please consult a qualified medical professional or doctor."
- If asked for any of the above, respond warmly but firmly:
  'I can offer cosmic guidance and reflection, but for [medical/legal/financial] matters, please consult a qualified professional.'
"""

    system_prompt_parts = [identity, safety]
    
    # SECTION 3 — If user_profile exists
    if state.get("user_profile"):
        natal_context = f"""
User's Birth Chart:
- Birth Details: {state['user_profile']['birth_place']} on {state['user_profile']['birth_date']} at {state['user_profile']['birth_time']}
- Ascendant: {state['user_profile'].get('ascendant', 'Unknown')}
- Planetary Placements:
{json.dumps(state['user_profile']['placements'], indent=2)}
- House Positions:
{json.dumps(state['user_profile']['houses'], indent=2)}
"""
        system_prompt_parts.append(natal_context)
        
    # SECTION 4 — If transit_data exists
    if state.get("transit_data"):
        transit_context = f"""
Today's Planetary Transits ({state['transit_data']['date']}):
{json.dumps(state['transit_data']['transits'], indent=2)}

Active Aspects to Your Natal Chart:
{json.dumps(state['transit_data']['aspects_to_natal'], indent=2)}
"""
        system_prompt_parts.append(transit_context)
        
    # SECTION 5 — If retrieved_docs exists and not empty
    if state.get("retrieved_docs"):
        kb_context = f"""
Relevant Astrological Interpretations:
{chr(10).join(state['retrieved_docs'])}
"""
        system_prompt_parts.append(kb_context)
        
    system_prompt = "\n\n".join(system_prompt_parts)
    
    response = await llm.ainvoke(
        [SystemMessage(content=system_prompt)] + state["messages"]
    )
    
    return {
        "messages": state["messages"] + [response],
        "retrieved_docs": []
    }
