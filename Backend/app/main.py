import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.chat import router as chat_router
from app.api.transits import router as transits_router

# Setup Logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Asynchronous lifecycle manager handling MongoDB connection pools during startup and shutdown.
    """
    logger.info("Initializing AstroAgent application startup lifecycle...")
    connect_to_mongo()
    yield
    logger.info("Initializing AstroAgent application shutdown lifecycle...")
    close_mongo_connection()

app = FastAPI(
    title="AstroAgent Conversational API",
    description="Stateful agentic conversational astrology platform powered by FastAPI, LangGraph, and MongoDB.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS)
# Crucial for allowing React dev servers (usually on localhost:5173) to query backend API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock down to designated web domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core system routes
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(chat_router)
app.include_router(transits_router)

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Basic health verification endpoint.
    """
    return {
        "status": "healthy",
        "service": "AstroAgent Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
