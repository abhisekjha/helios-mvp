import logging
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import get_database
import redis

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Helios MVP")

# Set all CORS enabled origins
cors_origins = ["http://localhost:3000", "http://localhost:3001"]  # Default origins

# Try to parse CORS origins from settings
if settings.BACKEND_CORS_ORIGINS:
    try:
        if isinstance(settings.BACKEND_CORS_ORIGINS, str):
            # If it's a JSON string, parse it
            cors_origins = json.loads(settings.BACKEND_CORS_ORIGINS)
        elif isinstance(settings.BACKEND_CORS_ORIGINS, list):
            # If it's already a list, use it directly
            cors_origins = settings.BACKEND_CORS_ORIGINS
    except json.JSONDecodeError:
        print(f"Warning: Could not parse CORS origins: {settings.BACKEND_CORS_ORIGINS}")
        print("Using default CORS origins")

print(f"CORS Origins configured: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """
    Connect to database and redis on startup
    """
    try:
        app.mongodb = get_database()
        print("✅ Successfully connected to database.")
    except Exception as e:
        print(f"❌ Could not connect to database: {e}")
        # Don't fail startup, the session.py will handle fallback

    try:
        app.redis_client = redis.from_url(settings.REDIS_URL)
        print("✅ Successfully connected to Redis.")
    except Exception as e:
        print(f"❌ Could not connect to Redis: {e}")
        # Create a mock redis client for testing
        app.redis_client = None


@app.on_event("shutdown")
async def shutdown_event():
    """
    Disconnect from database and redis on shutdown
    """
    if hasattr(app.mongodb, 'client'):
        app.mongodb.client.close()
    if app.redis_client:
        app.redis_client.close()


app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Helios Backend is running"}
# Trigger reload