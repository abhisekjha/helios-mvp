#!/usr/bin/env python3

import sys
sys.path.append('/Users/ajha/snapdev/helios-mvp/backend')

from app.agents.orchestrator import AgentOrchestrator
from app.db.session import get_database
from app.services.vector_embeddings import VectorEmbeddingService
import asyncio
import logging

# Set up logging to see our debug messages
logging.basicConfig(level=logging.INFO)

async def test_before_after():
    try:
        orchestrator = AgentOrchestrator()
        
        # Initialize vector service
        db = get_database()
        embedding_service = VectorEmbeddingService(db)
        orchestrator.retriever.set_vector_service(embedding_service)
        
        query = 'Create a comprehensive action plan to increase Q4 revenue by 25%'
        context = {'goal_id': '689edcebcdabbe9dab199344'}
        
        print('🧪 Testing before/after context creation...')
        result = await orchestrator.process_query_simple(query, context)
        
        print(f'\n✅ Before/after test completed!')
            
    except Exception as e:
        print(f'❌ Error: {e}')

if __name__ == "__main__":
    asyncio.run(test_before_after())
