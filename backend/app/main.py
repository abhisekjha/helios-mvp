import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import get_database
import redis

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Helios MVP")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["Authorization", "Content-Type"],
    )

@app.on_event("startup")
async def startup_event():
    """
    Connect to database and redis on startup
    """
    try:
        app.mongodb = get_database()
        print("Successfully connected to MongoDB.")
    except Exception as e:
        print(f"Could not connect to MongoDB: {e}")

    try:
        app.redis_client = redis.from_url(settings.REDIS_URL)
        print("Successfully connected to Redis.")
    except Exception as e:
        print(f"Could not connect to Redis: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Disconnect from database and redis on shutdown
    """
    app.mongodb.client.close()
    app.redis_client.close()


app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Helios Backend is running"}
# Trigger reload