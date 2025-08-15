"""
Base Agent Class for Helios Multi-Agent System

Provides the foundational structure and communication protocols
for all specialized agents in the system.
"""

import logging
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel

# Configure logging
logger = logging.getLogger(__name__)


class AgentMessage(BaseModel):
    """Standard message format for inter-agent communication"""
    sender: str
    recipient: str
    message_type: str  # 'query', 'response', 'tool_call', 'error'
    content: Dict[str, Any]
    timestamp: datetime
    conversation_id: str
    metadata: Optional[Dict[str, Any]] = None


class AgentResponse(BaseModel):
    """Standard response format from agents"""
    agent_name: str
    success: bool
    response: Any
    metadata: Dict[str, Any]
    execution_time: float
    error: Optional[str] = None


class BaseAgent(ABC):
    """
    Abstract base class for all agents in the Helios multi-agent system.
    
    Provides:
    - Standard communication protocols
    - Logging and monitoring
    - Error handling
    - Performance tracking
    """
    
    def __init__(self, agent_name: str, config: Optional[Dict[str, Any]] = None):
        self.agent_name = agent_name
        self.config = config or {}
        self.conversation_history: List[AgentMessage] = []
        self.performance_metrics = {
            "total_calls": 0,
            "successful_calls": 0,
            "average_response_time": 0.0,
            "last_error": None
        }
        
        logger.info(f"Initialized {self.agent_name} agent")
    
    @abstractmethod
    async def process(self, query: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Abstract method that each agent must implement.
        
        Args:
            query: The input query or request
            context: Additional context including goal_id, user_id, etc.
            
        Returns:
            AgentResponse with the agent's output
        """
        pass
    
    async def execute(self, query: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Execute the agent's processing with monitoring and error handling.
        
        Args:
            query: The input query
            context: Execution context
            
        Returns:
            AgentResponse with results and metadata
        """
        start_time = time.time()
        self.performance_metrics["total_calls"] += 1
        
        try:
            logger.info(f"{self.agent_name} processing query: {query[:100]}...")
            
            # Call the agent's specific processing logic
            response = await self.process(query, context)
            
            # Update performance metrics
            execution_time = time.time() - start_time
            response.execution_time = execution_time
            
            self.performance_metrics["successful_calls"] += 1
            self._update_average_response_time(execution_time)
            
            logger.info(f"{self.agent_name} completed successfully in {execution_time:.2f}s")
            return response
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"Error in {self.agent_name}: {str(e)}"
            
            logger.error(error_msg, exc_info=True)
            self.performance_metrics["last_error"] = error_msg
            
            return AgentResponse(
                agent_name=self.agent_name,
                success=False,
                response=None,
                metadata={"error_type": type(e).__name__},
                execution_time=execution_time,
                error=error_msg
            )
    
    def log_message(self, message: AgentMessage):
        """Log inter-agent communication for debugging and monitoring"""
        self.conversation_history.append(message)
        logger.debug(f"Agent communication: {message.sender} -> {message.recipient}: {message.message_type}")
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics for this agent"""
        return {
            **self.performance_metrics,
            "success_rate": self.performance_metrics["successful_calls"] / max(1, self.performance_metrics["total_calls"])
        }
    
    def _update_average_response_time(self, new_time: float):
        """Update rolling average response time"""
        current_avg = self.performance_metrics["average_response_time"]
        total_calls = self.performance_metrics["successful_calls"]
        
        if total_calls == 1:
            self.performance_metrics["average_response_time"] = new_time
        else:
            # Rolling average calculation
            self.performance_metrics["average_response_time"] = (
                (current_avg * (total_calls - 1) + new_time) / total_calls
            )
    
    def reset_metrics(self):
        """Reset performance metrics (useful for testing)"""
        self.performance_metrics = {
            "total_calls": 0,
            "successful_calls": 0,
            "average_response_time": 0.0,
            "last_error": None
        }
        logger.info(f"Reset performance metrics for {self.agent_name}")
