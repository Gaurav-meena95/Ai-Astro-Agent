from langgraph.graph import StateGraph, START, END
from app.graph.state import AgentState
from app.agent.nodes import (
    should_route,
    natal_engine_node,
    transit_engine_node,
    kb_lookup_node,
    agent_synthesizer_node
)

# 1. Initialize State Graph using AgentState TypedDict
builder = StateGraph(AgentState)

# 2. Add calculation, memory, and synthesis nodes
builder.add_node("natal_engine", natal_engine_node)
builder.add_node("transit_engine", transit_engine_node)
builder.add_node("kb_lookup", kb_lookup_node)
builder.add_node("agent_synthesizer", agent_synthesizer_node)

# 3. Define State transitions
# Start node determines routing dynamically based on user query intent
builder.add_conditional_edges(
    START,
    should_route,
    {
        "natal_engine": "natal_engine",
        "transit_engine": "transit_engine",
        "kb_lookup": "kb_lookup",
        "agent_synthesizer": "agent_synthesizer"
    }
)

# Connect calculation/retrieval paths to the main reasoning synthesizer node
builder.add_edge("natal_engine", "agent_synthesizer")
builder.add_edge("transit_engine", "agent_synthesizer")
builder.add_edge("kb_lookup", "agent_synthesizer")

# Synthesizer yields the final streamed response to the end state
builder.add_edge("agent_synthesizer", END)

# 4. Compile the graph runnable
agent_graph = builder.compile()
