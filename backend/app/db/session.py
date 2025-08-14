from fastapi import Request
from pymongo.database import Database
from app.core.config import settings
import pymongo
import certifi

def get_db(request: Request) -> Database:
    return request.app.mongodb

def get_database() -> Database:
    try:
        client = pymongo.MongoClient(settings.DATABASE_URL)
        db = client[settings.MONGODB_DB_NAME]
        return db
    except Exception as e:
        print(f"Could not connect to MongoDB: {e}")
        raise
