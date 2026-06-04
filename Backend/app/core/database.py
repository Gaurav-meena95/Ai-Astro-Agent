from motor.motor_asyncio import AsyncIOMotorClient
from app.core import config

client = None
db = None

async def connect_db():
    """
    Initializes the asynchronous motor client and database connection.
    """
    global client, db
    client = AsyncIOMotorClient(config.MONGO_URI)
    try:
        db = client.get_default_database()
    except Exception:
        db = client.get_database("astroagent")

async def close_db():
    """
    Closes the database client pool.
    """
    global client
    if client:
        client.close()

def get_db():
    """
    Retrieves the global database reference.
    """
    return db
