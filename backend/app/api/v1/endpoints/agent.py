"""
Enhanced Agent API endpoints using Multi-Agent System.
Handles complex queries through Router, Retrieval, and Synthesizer agents.
"""

from typing import AsyncGenerator, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
from datetime import datetime
import logging

from app.api import deps
from app.db.session import get_database
from app.models.user import User
from app.crud import crud_goal
from app.services.vector_embeddings import get_embedding_service
from app.core.config import settings

# Import Multi-Agent System
from app.agents.orchestrator import AgentOrchestrator

# Import OpenAI for legacy compatibility
from openai import OpenAI

router = APIRouter()
logger = logging.getLogger(__name__)


class AgentQueryRequest(BaseModel):
    goal_id: str
    query: str
    stream: bool = True


class AgentQueryResponse(BaseModel):
    goal_id: str
    query: str
    response: str
    sources: list
    timestamp: datetime


class ConversationAgent:
    """
    Enhanced Conversational Agent using Multi-Agent System.
    
    This agent now orchestrates multiple specialized agents:
    - RouterAgent: Query classification and planning
    - RetrievalAgent: Advanced data retrieval and aggregation
    - SynthesizerAgent: Response synthesis and insights
    """
    
    def __init__(self, db, embedding_service):
        self.db = db
        self.embedding_service = embedding_service
        self.openai_client = OpenAI(api_key=settings.LLM_API_KEY)
        
        # Initialize Multi-Agent System
        agent_config = {
            "retrieval": {
                "max_chunks": 15,
                "similarity_threshold": 0.6,
                "query_expansion": True
            },
            "synthesizer": {
                "max_tokens": 1200,
                "temperature": 0.3,
                "include_recommendations": True
            },
            "router": {},
            "max_execution_time": 60.0,
            "enable_streaming": True
        }
        
        self.orchestrator = AgentOrchestrator(agent_config)
        
        # Set the vector service for retrieval operations
        self.orchestrator.set_vector_service(embedding_service)
        
        logger.info("Enhanced ConversationAgent initialized with Multi-Agent System")
    
    async def generate_response(self, goal_id: str, query: str, user: User) -> Dict[str, Any]:
        """
        Generate a response using the Multi-Agent System.
        
        Args:
            goal_id: The goal ID to search within
            query: The user's question
            user: The authenticated user
            
        Returns:
            Dictionary containing response and metadata
        """
        # Verify goal access
        goal = crud_goal.get(self.db, id=goal_id)
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        if goal.owner_id != user.id:
            raise HTTPException(status_code=403, detail="Access denied to this goal")
        
        # Prepare context for multi-agent system
        context = {
            "goal_id": goal_id,
            "user_id": user.id,
            "goal_title": goal.objective_text,
            "goal_description": getattr(goal, 'description', 'No description provided')
        }
        
        try:
            # Use orchestrator for non-streaming response
            result = await self.orchestrator.process_query_simple(query, context)
            
            if result.success:
                return {
                    "response": result.final_response,
                    "sources": result.sources_used,
                    "has_data": True,
                    "goal_title": goal.objective_text,
                    "confidence": result.confidence,
                    "key_insights": result.key_insights,
                    "agent_logs": result.agent_logs,
                    "execution_time": result.execution_time
                }
            else:
                # Fallback to simple response
                return {
                    "response": f"I encountered an issue processing your question: {result.error}. Please try rephrasing your query.",
                    "sources": [],
                    "has_data": False,
                    "goal_title": goal.objective_text
                }
                
        except Exception as e:
            logger.error(f"Multi-agent system error: {e}")
            # Fallback response
            return {
                "response": f"I encountered an error while processing your question. Please try again. Error: {str(e)}",
                "sources": [],
                "has_data": False,
                "goal_title": goal.objective_text
            }
    
    async def generate_streaming_response(self, goal_id: str, query: str, user: User) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response using the Multi-Agent System.
        
        Args:
            goal_id: The goal ID to search within
            query: The user's question
            user: The authenticated user
            
        Yields:
            JSON strings containing response chunks
        """
        try:
            # Verify goal access
            goal = crud_goal.get(self.db, id=goal_id)
            if not goal:
                yield f"data: {json.dumps({'error': 'Goal not found'})}\n\n"
                return
            
            if goal.owner_id != user.id:
                yield f"data: {json.dumps({'error': 'Access denied to this goal'})}\n\n"
                return
            
            # Prepare context for multi-agent system
            context = {
                "goal_id": goal_id,
                "user_id": user.id,
                "goal_title": goal.objective_text,
                "goal_description": getattr(goal, 'description', 'No description provided')
            }
            
            # Stream the multi-agent response
            async for chunk in self.orchestrator.process_query(query, context):
                response_data = {
                    "type": "chunk",
                    "content": chunk
                }
                yield f"data: {json.dumps(response_data)}\n\n"
                await asyncio.sleep(0.05)  # Small delay for better streaming experience
            
            # Signal completion
            completion_data = {
                "type": "complete",
                "goal_title": goal.objective_text
            }
            yield f"data: {json.dumps(completion_data)}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming multi-agent error: {e}")
            error_data = {
                "type": "error",
                "content": f"An error occurred while processing your question: {str(e)}"
            }
            yield f"data: {json.dumps(error_data)}\n\n"


@router.post("/query")
async def query_agent(
    request: AgentQueryRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db = Depends(get_database)
):
    """
    Query the enhanced conversational agent using Multi-Agent System.
    Supports both regular and streaming responses with intelligent routing.
    """
    embedding_service = get_embedding_service(db)
    agent = ConversationAgent(db, embedding_service)
    
    if request.stream:
        # Return streaming response using Multi-Agent System
        async def generate():
            async for chunk in agent.generate_streaming_response(
                request.goal_id, 
                request.query, 
                current_user
            ):
                yield chunk
        
        return StreamingResponse(
            generate(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
    else:
        # Return regular JSON response using Multi-Agent System
        result = await agent.generate_response(
            request.goal_id,
            request.query,
            current_user
        )
        
        return AgentQueryResponse(
            goal_id=request.goal_id,
            query=request.query,
            response=result["response"],
            sources=result["sources"],
            timestamp=datetime.utcnow()
        )


@router.post("/test-query")
async def test_query_agent(
    request: AgentQueryRequest,
    db = Depends(get_database)
):
    """
    Test endpoint without authentication for debugging CSV data flow.
    """
    embedding_service = get_embedding_service(db)
    agent = ConversationAgent(db, embedding_service)
    
    # Create a mock user for testing
    mock_user = User(
        id="1",
        email="test@test.com",
        is_active=True,
        hashed_password="test",
        role="user"
    )
    
    # Return regular JSON response using Multi-Agent System
    result = await agent.generate_response(
        request.goal_id,
        request.query,
        mock_user
    )
    
    return AgentQueryResponse(
        goal_id=request.goal_id,
        query=request.query,
        response=result["response"],
        sources=result["sources"],
        timestamp=datetime.utcnow()
    )


@router.get("/knowledge-stats/{goal_id}")
async def get_knowledge_stats(
    goal_id: str,
    current_user: User = Depends(deps.get_current_active_user),
    db = Depends(get_database)
):
    """
    Get statistics about the knowledge base for a specific goal.
    """
    # Verify goal access
    goal = crud_goal.get(db, id=goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if goal.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this goal")
    
    embedding_service = get_embedding_service(db)
    stats = embedding_service.get_goal_knowledge_stats(goal_id)
    
    return {
        "goal_id": goal_id,
        "goal_title": goal.objective_text,
        "knowledge_base_stats": stats
    }


@router.get("/agent-performance")
async def get_agent_performance(
    current_user: User = Depends(deps.get_current_active_user),
    db = Depends(get_database)
):
    """
    Get performance metrics for the Multi-Agent System.
    Available only to directors for monitoring system performance.
    """
    if current_user.role != "director":
        raise HTTPException(status_code=403, detail="Access denied")
    
    embedding_service = get_embedding_service(db)
    agent = ConversationAgent(db, embedding_service)
    
    metrics = agent.orchestrator.get_performance_metrics()
    
    return {
        "timestamp": datetime.utcnow(),
        "multi_agent_performance": metrics,
        "system_status": "operational"
    }
