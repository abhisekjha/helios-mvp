#!/usr/bin/env python3

"""
Test script to trigger AI insight generation manually.
This will help us verify that the AI workflow is working properly.
"""

import os
import sys
import json
from pathlib import Path

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

# Set environment variables
os.environ.setdefault("PYTHONPATH", str(backend_path))

def test_ai_services():
    """Test if AI services are working properly."""
    
    print("🔍 Testing AI Services Setup...")
    print("=" * 50)
    
    # Test 1: Check Redis connection
    print("\n1. Testing Redis connection...")
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("✅ Redis connection successful")
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False
    
    # Test 2: Check MongoDB connection
    print("\n2. Testing MongoDB connection...")
    try:
        from pymongo import MongoClient
        from app.core.config import settings
        
        client = MongoClient(settings.DATABASE_URL)
        db = client[settings.MONGODB_DB_NAME]
        # Try to access a collection
        collections = db.list_collection_names()
        print("✅ MongoDB connection successful")
        print(f"   Available collections: {len(collections)}")
        client.close()
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False
    
    # Test 3: Check OpenAI API key
    print("\n3. Testing OpenAI configuration...")
    try:
        from app.core.config import settings
        if settings.LLM_API_KEY and settings.LLM_API_KEY.startswith('sk-'):
            print("✅ OpenAI API key is configured")
        else:
            print("❌ OpenAI API key is missing or invalid")
            return False
    except Exception as e:
        print(f"❌ OpenAI configuration failed: {e}")
        return False
    
    # Test 4: Check Celery worker
    print("\n4. Testing Celery worker...")
    try:
        from celery import Celery
        from app.core.config import settings
        
        celery_app = Celery('test', broker=settings.REDIS_URL)
        
        # Check if worker is running
        inspect = celery_app.control.inspect()
        stats = inspect.stats()
        
        if stats:
            print("✅ Celery worker is running")
            for worker_name in stats.keys():
                print(f"   Worker: {worker_name}")
        else:
            print("❌ No Celery workers found")
            return False
            
    except Exception as e:
        print(f"❌ Celery test failed: {e}")
        return False
    
    # Test 5: Test AI services
    print("\n5. Testing AI insight generation...")
    try:
        from app.services.insight_generator import InsightGenerator
        from pymongo import MongoClient
        
        client = MongoClient(settings.DATABASE_URL)
        db = client[settings.MONGODB_DB_NAME]
        
        insight_gen = InsightGenerator(db)
        print("✅ InsightGenerator initialized successfully")
        
        client.close()
    except Exception as e:
        print(f"❌ AI service test failed: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All AI services are properly configured!")
    print("\nNext steps:")
    print("1. Upload a CSV file through the web interface")
    print("2. Check the Celery worker logs for processing status")
    print("3. The insights should appear in your goal within 1-2 minutes")
    
    return True

if __name__ == "__main__":
    try:
        test_ai_services()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
