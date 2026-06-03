import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Fetch MongoDB URI from environment variables with absolute fallback
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "astro_agent_db")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

def connect_to_mongo():
    """
    Establishes asynchronous connection to the MongoDB instance.
    Called during application startup.
    """
    try:
        logger.info(f"Connecting to MongoDB at {MONGODB_URI}...")
        db_instance.client = AsyncIOMotorClient(MONGODB_URI)
        db_instance.db = db_instance.client[DATABASE_NAME]
        logger.info("Connected to MongoDB successfully!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

def close_mongo_connection():
    """
    Closes the connection pool. Called during application shutdown.
    """
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    """
    Dependency helper to retrieve the active MongoDB database object.
    """
    if db_instance.db is None:
         # Lazy load/test cases compatibility
         connect_to_mongo()
    return db_instance.db
