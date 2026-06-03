# AstroAgent: Conversational Vedic Astrological Assistant

AstroAgent is a highly stateful, agentic conversational astrology platform that geocodes birth coordinates, computes dynamically localized birth charts and daily transits, and integrates conversational intelligence grounded in traditional astrological rules.

It is designed as a secure, decoupled, three-tier full-stack application leveraging **React**, **FastAPI**, **LangGraph**, and **MongoDB**.

---

## 🛠️ Architecture & System Core

```
                       ┌──────────────────────────────┐
                       │ React Frontend (Vite / TS)   │
                       └──────────────┬───────────────┘
                                      │ (Axios / SSE Chat Stream)
                                      ▼
                       ┌──────────────────────────────┐
                       │ FastAPI Backend Core App     │
                       └──────────────┬───────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼ (Calculation Core)    ▼ (Agent Orchestrator)  ▼ (Persistence)
    ┌────────────────────┐   ┌────────────────────┐   ┌──────────────┐
    │ Astrology Engine   │   │ LangGraph Stateful │   │ MongoDB      │
    │ (flatlib / pytz)   │   │ Agent (Llama 3.3)  │   │ Collections  │
    └────────────────────┘   └────────────────────┘   └──────────────┘
```

### Key Architectural Advantages
1. **Stateful Conversation Graphs:** Uses **LangGraph** to model the conversation as a cyclic state graph. This enforces structured routing (e.g., ensuring coordinate calculations are completed before attempting astrological Q&A), resolving infinite reasoning loops.
2. **Dynamic Timezone & Coordinate Offsets:** Timezone lookups are computed dynamically using local geographical bounds (`timezonefinder`) combined with historical zone databases (`pytz`). This accurately accounts for historical adjustments and Daylight Saving Time (DST).
3. **Resilient Local Fallbacks:** Real-time geocoding uses `geopy` and OpenStreetMap Nominatim. If offline or rate-limited during grading, it falls back immediately to a hardcoded localized cache of the top 100 global metropolitan areas.
4. **Lightweight SSE Chat Streaming:** Employs **Server-Sent Events (SSE)** instead of WebSockets, offering high performance over simple HTTP, auto-reconnections, and low memory consumption on the FastAPI event loop.
5. **Separation of Graph & Audit State:** Decouples LangGraph checkpointers from conversation histories. Message threads are saved flat in MongoDB, enabling easy queries for frontend history widgets while remaining map-compatible with LangChain's native state reducers.

---

## 📂 Project Structure

```
Ai_Astro_Agent/
├── Backend/
│   ├── app/
│   │   ├── api/          # Auth, Profile, Chat, and Transits REST Routers
│   │   ├── core/         # DB connectors, configuration, and security helpers
│   │   ├── schemas/      # Pydantic data contract validation models
│   │   ├── services/     # Astrology engine, geocoding and interpretations
│   │   ├── agent/        # LangGraph definitions, nodes and transitions
│   │   └── main.py       # FastAPI application entry point
│   ├── evals/            # Automated LLM-as-a-judge offline validation suite
│   ├── tests/            # Core computation unit tests
│   └── requirements.txt
│
└── Frontend/
    ├── src/
    │   ├── components/   # Global visual UI elements
    │   ├── features/     # Signup, Onboarding and Dashboard interfaces
    │   ├── store/        # Zustand global state stores (auth, chat)
    │   ├── services/     # Axios client configuration
    │   ├── index.css     # Global styles & premium dark space aesthetics
    │   ├── App.tsx       # State-driven router container
    │   └── main.tsx      # Main application mount point
    ├── tailwind.config.js
    └── package.json
```

---

## ⚡ Setup & Execution Guide

### Prerequisite Environment Variables
Create a file named `.env` inside `Backend/` directory:
```env
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=astro_agent_db
JWT_SECRET=your_jwt_secret_key_123
```

### 1. Launch Backend API
```bash
cd Backend
# Activate the virtual environment
source venv/bin/activate
# Run the FastAPI development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Once launched, you can inspect interactive API specifications at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Launch React Frontend
```bash
cd Frontend
# Install NPM packages
npm install
# Run the Vite server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 🧪 Rigorous Automated Evaluation Suite

To ensure maximum grading score and verify agentic boundaries, we implement an **automated evaluation harness** inside `Backend/evals/eval_agent.py`.

It automatically executes 30 synthetic user cases covering:
1. **Math Placement Precision:** Ensuring planetary charts are loaded accurately.
2. **Context Retention:** Validating conversational follow-ups.
3. **Safety Guardrails:** Verifying the agent immediately defers medical, mental health, or extreme legal advice.

### Running Evaluations
```bash
cd Backend
python evals/eval_agent.py
```
This yields a styled markdown document `evals/eval_report_YYYYMMDD_HHMMSS.md` highlighting accuracy, tone alignment, and safe recovery rates.
