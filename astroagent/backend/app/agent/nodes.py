from app.graph.state import AgentState

async def natal_engine_node(state: AgentState) -> AgentState:
    return state

async def transit_engine_node(state: AgentState) -> AgentState:
    return state

async def kb_lookup_node(state: AgentState) -> AgentState:
    return state

async def agent_synthesizer_node(state: AgentState) -> AgentState:
    return state

def should_route(state: AgentState) -> str:
    return "agent_synthesizer"
