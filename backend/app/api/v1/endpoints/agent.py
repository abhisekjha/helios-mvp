"""
Agent API endpoints for conversational interactions with the knowledge base.
Handles queries, streaming responses, and goal-specific conversations.
"""

from typing import AsyncGenerator, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
from datetime import datetime

from app.api import deps
from app.db.session import get_database
from app.models.user import User
from app.crud import crud_goal
from app.services.vector_embeddings import get_embedding_service
from app.core.config import settings

# Import OpenAI for LLM responses
from openai import OpenAI

router = APIRouter()


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
    Conversational agent that can answer questions about goal-specific data
    using the knowledge base and LLM reasoning.
    """
    
    def __init__(self, db, embedding_service):
        self.db = db
        self.embedding_service = embedding_service
        self.openai_client = OpenAI(api_key=settings.LLM_API_KEY)
    
    async def generate_response(self, goal_id: str, query: str, user: User) -> Dict[str, Any]:
        """
        Generate a response to a user query using the knowledge base.
        
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
        
        # Search the knowledge base
        relevant_chunks = self.embedding_service.search_knowledge_base(goal_id, query, top_k=5)
        
        if not relevant_chunks:
            return {
                "response": f"I don't have any data uploaded for the goal '{goal.objective_text}' yet. Please upload some CSV data first, and I'll be able to answer questions about it.",
                "sources": [],
                "has_data": False
            }
        
        # Prepare context for the LLM
        context_parts = []
        sources = []
        
        for chunk in relevant_chunks:
            context_parts.append(f"Data: {chunk['text']}")
            sources.append({
                "text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
                "type": chunk["type"],
                "similarity_score": chunk["similarity_score"]
            })
        
        context = "\\n\\n".join(context_parts)
        
        # Create the prompt
        prompt = f"""You are Helios, an AI assistant that helps users analyze their business data and make strategic decisions. 

You have access to data uploaded for the goal: "{goal.objective_text}"
Goal Description: {getattr(goal, 'description', 'No description provided')}

Based on the following relevant data, please answer the user's question. Be specific, helpful, and reference actual data points when possible.

Relevant Data Context:
{context}

User Question: {query}

Please provide a clear, concise answer based on the data. If the data doesn't contain enough information to fully answer the question, explain what information is available and what might be missing."""
        
        # Generate response using OpenAI
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are Helios, a helpful AI assistant for business data analysis and strategic planning."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
        except Exception as e:
            ai_response = f"I encountered an error while processing your question. Please try rephrasing your query. Error: {str(e)}"
        
        return {
            "response": ai_response,
            "sources": sources,
            "has_data": True,
            "goal_title": goal.objective_text
        }
    
    async def generate_streaming_response(self, goal_id: str, query: str, user: User) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response for real-time user experience.
        
        Args:
            goal_id: The goal ID to search within
            query: The user's question
            user: The authenticated user
            
        Yields:
            JSON strings containing response chunks
        """
        try:
            # First, get the context (non-streaming)
            goal = crud_goal.get(self.db, id=goal_id)
            if not goal:
                yield f"data: {json.dumps({'error': 'Goal not found'})}\n\n"
                return
            
            if goal.owner_id != user.id:
                yield f"data: {json.dumps({'error': 'Access denied to this goal'})}\n\n"
                return
            
            # Search knowledge base
            relevant_chunks = self.embedding_service.search_knowledge_base(goal_id, query, top_k=5)
            
            if not relevant_chunks:
                response_data = {
                    "type": "complete",
                    "content": f"I don't have any data uploaded for the goal '{goal.objective_text}' yet. Please upload some CSV data first, and I'll be able to answer questions about it.",
                    "sources": [],
                    "has_data": False
                }
                yield f"data: {json.dumps(response_data)}\n\n"
                return
            
            # Prepare context
            context_parts = []
            sources = []
            
            for chunk in relevant_chunks:
                context_parts.append(f"Data: {chunk['text']}")
                sources.append({
                    "text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
                    "type": chunk["type"],
                    "similarity_score": chunk["similarity_score"]
                })
            
            context = "\\n\\n".join(context_parts)
            
            # Create prompt
            prompt = f"""You are Helios, an AI assistant that helps users analyze their business data and make strategic decisions. 

You have access to data uploaded for the goal: "{goal.objective_text}"
Goal Description: {getattr(goal, 'description', 'No description provided')}

Based on the following relevant data, please answer the user's question. Be specific, helpful, and reference actual data points when possible.

Relevant Data Context:
{context}

User Question: {query}

Please provide a clear, concise answer based on the data. If the data doesn't contain enough information to fully answer the question, explain what information is available and what might be missing."""
            
            # Stream the response from OpenAI
            stream = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are Helios, a helpful AI assistant for business data analysis and strategic planning."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7,
                stream=True
            )
            
            # Send sources first
            yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
            
            # Stream the response
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            error_response = {
                "type": "error",
                "error": f"An error occurred: {str(e)}"
            }
            yield f"data: {json.dumps(error_response)}\n\n"


@router.post("/query")
async def query_agent(
    request: AgentQueryRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db = Depends(get_database)
):
    """
    Query the conversational agent for a specific goal.
    Supports both regular and streaming responses.
    """
    embedding_service = get_embedding_service(db)
    agent = ConversationAgent(db, embedding_service)
    
    if request.stream:
        # Return streaming response
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
        # Return regular JSON response
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
