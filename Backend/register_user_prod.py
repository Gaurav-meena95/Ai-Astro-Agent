import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
import os
from dotenv import load_dotenv

# Setup password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def register():
    # Load env from .env.production
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(base_dir, ".env.production")
    if not os.path.exists(env_path):
        print(f"Error: .env.production not found at {env_path}")
        return
        
    load_dotenv(env_path, override=True)
    mongo_uri = os.getenv("MONGO_URI")
    
    if not mongo_uri or mongo_uri.startswith("mongodb://localhost"):
        print("Warning: MONGO_URI in .env.production is missing or points to localhost.")
        return

    print(f"Connecting to production database: {mongo_uri.split('@')[-1]}")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_default_database()
    
    email = "gaurav.meena2024@nst.rishihood.edu.in"
    password = "gaurav.meena2024@nst.rishihood.edu.in"
    
    # Check if user already exists
    try:
        existing = await db.users.find_one({"email": email})
        if existing:
            print("User already exists in production DB. Updating password...")
            hashed_password = pwd_context.hash(password)
            await db.users.update_one(
                {"_id": existing["_id"]},
                {"$set": {"hashed_password": hashed_password}}
            )
            print("Successfully updated password for user:", email)
        else:
            print("Creating user in production DB...")
            hashed_password = pwd_context.hash(password)
            user_doc = {
                "username": "gaurav_meena",
                "email": email,
                "hashed_password": hashed_password,
                "created_at": datetime.utcnow()
            }
            result = await db.users.insert_one(user_doc)
            print("Successfully created user with id:", result.inserted_id)
    except Exception as e:
        print(f"Error: {e}")
        print("\nIf you got an SSL/TLS handshake or timeout error, make sure your current IP address is whitelisted in MongoDB Atlas Network Access.")

    client.close()

if __name__ == "__main__":
    asyncio.run(register())
