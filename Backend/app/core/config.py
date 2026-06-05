from dotenv import load_dotenv
import os

if not os.getenv("VERCEL"):
    env_file = ".env.production" if os.getenv("ENV") == "production" else ".env"
    # Resolve the path relative to the current file
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_path = os.path.join(base_dir, env_file)
    load_dotenv(env_path, override=True)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/astroagent")
JWT_SECRET = os.getenv("JWT_SECRET", "fallback_secret")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
