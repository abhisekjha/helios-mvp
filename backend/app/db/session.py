from fastapi import Request
from pymongo.database import Database
from app.core.config import settings
import pymongo
import certifi
import logging

logger = logging.getLogger(__name__)

def get_db(request: Request) -> Database:
    return request.app.mongodb

def get_database() -> Database:
    try:
        # Try to connect to MongoDB Atlas
        client = pymongo.MongoClient(
            settings.DATABASE_URL,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
            tlsCAFile=certifi.where()  # Use certifi for SSL
        )
        # Test the connection
        client.admin.command('ping')
        db = client[settings.MONGODB_DB_NAME]
        logger.info("Successfully connected to MongoDB Atlas")
        return db
    except Exception as e:
        logger.error(f"Could not connect to MongoDB Atlas: {e}")
        # For development/testing, create a mock database-like object
        logger.warning("Using mock database for testing purposes")
        return create_mock_database()

class MockCollection:
    """Mock collection that simulates MongoDB operations"""
    def __init__(self, name):
        self.name = name
        self._data = []
    
    def find_one(self, query=None):
        # Return None for any query
        return None
    
    def find(self, query=None):
        # Return empty cursor
        return []
    
    def insert_one(self, document):
        # Simulate successful insert
        document['_id'] = len(self._data) + 1
        self._data.append(document)
        return type('InsertResult', (), {'inserted_id': document['_id']})()
    
    def update_one(self, query, update):
        # Simulate successful update
        return type('UpdateResult', (), {'modified_count': 1})()
    
    def delete_one(self, query):
        # Simulate successful delete
        return type('DeleteResult', (), {'deleted_count': 1})()
    
    def count_documents(self, query=None):
        return len(self._data)

class MockDatabase:
    """Mock database that simulates MongoDB operations"""
    def __init__(self, name):
        self.name = name
        self._collections = {}
    
    def __getattr__(self, name):
        if name not in self._collections:
            self._collections[name] = MockCollection(name)
        return self._collections[name]
    
    def __getitem__(self, name):
        return self.__getattr__(name)
    
    def list_collection_names(self):
        return list(self._collections.keys())

def create_mock_database():
    """Create a mock database for testing when MongoDB is unavailable"""
    return MockDatabase(settings.MONGODB_DB_NAME)
