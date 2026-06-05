import os
import sys

# 0. Patch bcrypt compatibility for passlib (fixes AttributeError and 72-byte ValueError on Python 3.12+)
try:
    import bcrypt
    class DummyAbout:
        __version__ = getattr(bcrypt, "__version__", "4.0.0")
    bcrypt.__about__ = DummyAbout()
except ImportError:
    pass

# 1. Config writeable cache directory on Vercel for libephemeris
if os.getenv("VERCEL"):
    os.environ["LIBEPHEMERIS_DATA_DIR"] = "/tmp"

# 2. Map swisseph to libephemeris using a wrapper class to handle default parameters (C-API compatibility)
try:
    # pyrefly: ignore [missing-import]
    import libephemeris
    
    class SwissephWrapper:
        def __getattr__(self, name):
            return getattr(libephemeris, name)
            
        def calc_ut(self, tjd_ut, ipl, iflag=0):
            return libephemeris.calc_ut(tjd_ut, ipl, iflag)
            
    sys.modules['swisseph'] = SwissephWrapper()
except ImportError:
    pass

# 3. Add app base directory to sys.path so that 'import flatlib' resolves to the vendored 'app/flatlib'
base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, base_dir)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_db, close_db
from app.api import auth, chat, profile

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(title="AstroAgent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])

@app.get("/")
async def root():
    return {"message": "AstroAgent API", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy"} # reload trigger
