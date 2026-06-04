from langgraph.graph import StateGraph, END, START
from app.graph.state import AgentState
from app.agent.nodes import (
    natal_engine_node,
    transit_engine_node, 
    kb_lookup_node,
    agent_synthesizer_node,
    should_route
)

def route_natal(state: AgentState) -> str:
    if state.get("system_error") == "extraction_failed" or not state.get("user_profile"):
        return END
    return "agent_synthesizer"

builder = StateGraph(AgentState)

builder.add_node("natal_engine", natal_engine_node)
builder.add_node("transit_engine", transit_engine_node)
builder.add_node("kb_lookup", kb_lookup_node)
builder.add_node("agent_synthesizer", agent_synthesizer_node)

builder.add_conditional_edges(START, should_route, {
    "natal_engine": "natal_engine",
    "transit_engine": "transit_engine",
    "kb_lookup": "kb_lookup",
    "agent_synthesizer": "agent_synthesizer"
})

builder.add_conditional_edges("natal_engine", route_natal, {
    "agent_synthesizer": "agent_synthesizer",
    END: END
})

builder.add_edge("transit_engine", "agent_synthesizer")
builder.add_edge("kb_lookup", "agent_synthesizer")
builder.add_edge("agent_synthesizer", END)

agent_graph = builder.compile()
