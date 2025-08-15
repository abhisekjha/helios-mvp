"""
Agent Orchestrator for Helios Multi-Agent System

The AgentOrchestrator coordinates the workflow between multiple agents:
- RouterAgent: Query classification and planning
- RetrievalAgent: Data access and aggregation
- SynthesizerAgent: Response generation and insights

This orchestrator implements the execution plans created by the RouterAgent
and manages the flow of information between agents.
"""

import logging
import asyncio
from typing import Any, Dict, List, Optional, AsyncGenerator
from datetime import datetime

from .router_agent import RouterAgent
from .retrieval_agent import RetrievalAgent
from .synthesizer_agent import SynthesizerAgent
from .base_agent import AgentResponse

logger = logging.getLogger(__name__)


class OrchestrationResult:
    """Result from multi-agent orchestration"""
    def __init__(self):
        self.final_response: str = ""
        self.confidence: float = 0.0
        self.sources_used: List[str] = []
        self.key_insights: List[str] = []
        self.agent_logs: List[Dict[str, Any]] = []
        self.execution_time: float = 0.0
        self.success: bool = False
        self.error: Optional[str] = None


class AgentOrchestrator:
    """
    Orchestrates the multi-agent workflow for complex query processing.
    
    Workflow:
    1. RouterAgent classifies query and creates execution plan
    2. RetrievalAgent(s) fetch and process data according to plan
    3. SynthesizerAgent generates final response with insights
    4. Results are streamed back to the user
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        
        # Initialize agents
        self.router = RouterAgent(self.config.get("router", {}))
        self.retriever = RetrievalAgent(self.config.get("retrieval", {}))
        self.synthesizer = SynthesizerAgent(self.config.get("synthesizer", {}))
        
        # Orchestration settings
        self.max_execution_time = self.config.get("max_execution_time", 60.0)  # seconds
        self.enable_streaming = self.config.get("enable_streaming", True)
        self.fallback_enabled = self.config.get("fallback_enabled", True)
        
        logger.info("Agent Orchestrator initialized with multi-agent system")
    
    def set_vector_service(self, vector_service):
        """Set the vector service for the retrieval agent"""
        self.retriever.set_vector_service(vector_service)
    
    def set_vector_service(self, vector_service):
        """Set the vector service for the retriever agent"""
        self.retriever.set_vector_service(vector_service)
    
    async def process_query(self, query: str, context: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """
        Process query through the multi-agent system with streaming response.
        
        Args:
            query: User's question or request
            context: Context including goal_id, user_id, etc.
            
        Yields:
            Streaming response chunks
        """
        result = OrchestrationResult()
        start_time = datetime.now()
        
        try:
            logger.info(f"Starting multi-agent processing for query: {query[:100]}...")
            
            # Step 1: Route and plan
            yield "🧠 Analyzing your question...\n\n"
            await asyncio.sleep(0.1)
            
            routing_response = await self.router.execute(query, context)
            result.agent_logs.append({
                "agent": "RouterAgent",
                "success": routing_response.success,
                "metadata": routing_response.metadata,
                "execution_time": routing_response.execution_time
            })
            
            if not routing_response.success:
                yield f"❌ Failed to analyze query: {routing_response.error}\n"
                result.error = routing_response.error
                return
            
            execution_plan = routing_response.response.get("execution_plan", [])
            classification = routing_response.response.get("classification", {})
            
            yield f"📋 Query classified as: **{classification.get('query_type', 'unknown')}**\n"
            await asyncio.sleep(0.1)
            yield f"🎯 Confidence: {classification.get('confidence', 0):.0%}\n"
            await asyncio.sleep(0.1)
            yield f"📊 Planning {len(execution_plan)} processing steps...\n\n"
            await asyncio.sleep(0.2)
            
            # Step 2: Execute the plan
            retrieved_data = []
            
            for step in execution_plan:
                step_num = step.get("step", 0)
                agent_name = step.get("agent", "")
                action = step.get("action", "")
                description = step.get("description", "")
                
                yield f"⚡ Step {step_num}: {description}...\n"
                
                if agent_name == "RetrievalAgent":
                    # Execute retrieval step
                    retrieval_context = {
                        **context,
                        "action": action,
                        "step_info": step
                    }
                    
                    retrieval_response = await self.retriever.execute(query, retrieval_context)
                    result.agent_logs.append({
                        "agent": "RetrievalAgent",
                        "action": action,
                        "success": retrieval_response.success,
                        "metadata": retrieval_response.metadata,
                        "execution_time": retrieval_response.execution_time
                    })
                    
                    if retrieval_response.success:
                        response_data = retrieval_response.response.data
                        logger.info(f"Retrieval response data: {len(response_data)} items")
                        for i, item in enumerate(response_data[:3]):  # Log first 3 items
                            item_type = item.get("type", "unknown")
                            content_len = len(item.get("content", ""))
                            insights_count = len(item.get("data_insights", []))
                            logger.info(f"  Response item {i+1}: type={item_type}, content_len={content_len}, insights={insights_count}")
                        
                        retrieved_data.extend(response_data)
                        logger.info(f"Retrieved data total after merge: {len(retrieved_data)} items")
                        
                        yield f"✅ Retrieved {len(response_data)} relevant data points\n"
                        await asyncio.sleep(0.1)
                    else:
                        yield f"⚠️ Retrieval had issues: {retrieval_response.error}\n"
                        await asyncio.sleep(0.1)
            
            yield f"⚡ Step 2: Generate comprehensive response...\n"
            await asyncio.sleep(0.1)
            yield f"\n🔄 Synthesizing comprehensive response...\n\n"
            await asyncio.sleep(0.2)
            
            # Step 3: Synthesize final response
            synthesis_context = {
                **context,
                "retrieved_data": retrieved_data,
                "synthesis_type": self._determine_synthesis_type(classification),
                "execution_plan": execution_plan
            }
            
            synthesis_response = await self.synthesizer.execute(query, synthesis_context)
            result.agent_logs.append({
                "agent": "SynthesizerAgent",
                "success": synthesis_response.success,
                "metadata": synthesis_response.metadata,
                "execution_time": synthesis_response.execution_time
            })
            
            if synthesis_response.success:
                synthesized = synthesis_response.response
                
                # Stream the main answer
                yield "## 📈 Analysis Results\n\n"
                
                # Stream answer in chunks for better UX
                answer_chunks = self._chunk_text(synthesized.answer, 100)
                for chunk in answer_chunks:
                    yield chunk
                    await asyncio.sleep(0.1)  # Small delay for streaming effect
                
                yield "\n\n"
                
                # Add key insights if available
                if synthesized.key_insights:
                    yield "## 💡 Key Insights\n\n"
                    for insight in synthesized.key_insights:
                        yield f"• {insight}\n"
                    yield "\n"
                
                # Add recommendations if available
                if synthesized.recommendations:
                    yield "## 🎯 Recommendations\n\n"
                    for i, rec in enumerate(synthesized.recommendations, 1):
                        yield f"{i}. {rec}\n"
                    yield "\n"
                
                # Add data sources
                if synthesized.sources_used:
                    yield "## 📊 Data Sources\n\n"
                    for source in synthesized.sources_used:
                        yield f"• {source}\n"
                    yield "\n"
                
                # Add confidence indicator
                confidence_emoji = "🟢" if synthesized.confidence > 0.7 else "🟡" if synthesized.confidence > 0.4 else "🔴"
                yield f"**Confidence Level:** {confidence_emoji} {synthesized.confidence:.0%}\n\n"
                
                # Update result
                result.final_response = synthesized.answer
                result.confidence = synthesized.confidence
                result.sources_used = synthesized.sources_used
                result.key_insights = synthesized.key_insights
                result.success = True
                
            else:
                yield f"❌ Failed to synthesize response: {synthesis_response.error}\n"
                result.error = synthesis_response.error
            
            # Final execution stats
            end_time = datetime.now()
            result.execution_time = (end_time - start_time).total_seconds()
            
            yield f"---\n"
            yield f"*Processing completed in {result.execution_time:.1f}s using {len(result.agent_logs)} agents*\n"
            
        except Exception as e:
            logger.error(f"Orchestration error: {str(e)}", exc_info=True)
            yield f"❌ **System Error:** {str(e)}\n"
            result.error = str(e)
            result.success = False
    
    async def process_query_simple(self, query: str, context: Dict[str, Any]) -> OrchestrationResult:
        """
        Process query through multi-agent system without streaming (for API calls).
        
        Args:
            query: User's question
            context: Processing context
            
        Returns:
            OrchestrationResult with complete response
        """
        result = OrchestrationResult()
        start_time = datetime.now()
        
        try:
            # Step 1: Route and plan
            routing_response = await self.router.execute(query, context)
            result.agent_logs.append({
                "agent": "RouterAgent",
                "success": routing_response.success,
                "metadata": routing_response.metadata
            })
            
            if not routing_response.success:
                result.error = routing_response.error
                return result
            
            execution_plan = routing_response.response.get("execution_plan", [])
            classification = routing_response.response.get("classification", {})
            
            # Debug: Log execution plan
            logger.info(f"📋 Execution plan has {len(execution_plan)} steps:")
            for i, step in enumerate(execution_plan):
                logger.info(f"  Step {i+1}: agent={step.get('agent')}, action={step.get('action')}")
            
            # Step 2: Execute retrieval steps
            retrieved_data = []
            
            for step in execution_plan:
                if step.get("agent") == "RetrievalAgent":
                    retrieval_context = {
                        **context,
                        "action": step.get("action", "vector_search")
                    }
                    
                    retrieval_response = await self.retriever.execute(query, retrieval_context)
                    result.agent_logs.append({
                        "agent": "RetrievalAgent",
                        "success": retrieval_response.success,
                        "metadata": retrieval_response.metadata
                    })
                    
                    if retrieval_response.success:
                        new_data = retrieval_response.response.data
                        logger.info(f"🔄 Step {step.get('action', 'unknown')}: Retrieved {len(new_data)} items")
                        
                        # Debug: Log data types being added
                        csv_count = sum(1 for item in new_data if item.get("type") == "csv_data")
                        vector_count = sum(1 for item in new_data if item.get("type") == "vector_search")
                        logger.info(f"  Adding: {csv_count} CSV items, {vector_count} vector items")
                        
                        # Debug: Show actual content of new_data
                        logger.info(f"🔍 Actual content of new_data from retrieval:")
                        for i, item in enumerate(new_data[:3]):
                            logger.info(f"  new_data item {i+1}: type={item.get('type')}, content_len={len(item.get('content', ''))}, insights={len(item.get('data_insights', []))}")
                        
                        retrieved_data.extend(new_data)
                        logger.info(f"  Total data now: {len(retrieved_data)} items")
            
            # Step 3: Synthesize response
            logger.info(f"🧠 Preparing data for synthesizer: {len(retrieved_data)} items")
            
            # Debug: Log final data breakdown
            final_csv_count = sum(1 for item in retrieved_data if item.get("type") == "csv_data")
            final_vector_count = sum(1 for item in retrieved_data if item.get("type") == "vector_search")
            total_insights = sum(len(item.get("data_insights", [])) for item in retrieved_data)
            logger.info(f"  Final breakdown: {final_csv_count} CSV items, {final_vector_count} vector items, {total_insights} insights")
            
            # Debug: Check if context has retrieved_data that might override
            logger.info(f"📋 Original context keys: {list(context.keys())}")
            if "retrieved_data" in context:
                logger.info(f"⚠️  WARNING: Context already has retrieved_data with {len(context['retrieved_data'])} items!")
            
            # Debug: Show actual first few items before context creation
            logger.info(f"🔍 Retrieved_data BEFORE context creation:")
            for i, item in enumerate(retrieved_data[:3]):
                logger.info(f"  Before item {i+1}: type={item.get('type')}, content_len={len(item.get('content', ''))}, insights={len(item.get('data_insights', []))}")
            
            synthesis_context = {
                **context,
                "retrieved_data": retrieved_data,
                "synthesis_type": self._determine_synthesis_type(classification)
            }
            
            # Debug: Show actual first few items after context creation  
            logger.info(f"🔍 Retrieved_data AFTER context creation:")
            for i, item in enumerate(synthesis_context['retrieved_data'][:3]):
                logger.info(f"  After item {i+1}: type={item.get('type')}, content_len={len(item.get('content', ''))}, insights={len(item.get('data_insights', []))}")
            
            # Debug: Log what we're actually passing to synthesizer
            logger.info(f"🔍 About to call synthesizer with context containing {len(synthesis_context['retrieved_data'])} items:")
            for i, item in enumerate(synthesis_context['retrieved_data'][:3]):
                logger.info(f"  Context item {i+1}: type={item.get('type')}, content_len={len(item.get('content', ''))}, insights={len(item.get('data_insights', []))}")
            
            synthesis_response = await self.synthesizer.execute(query, synthesis_context)
            result.agent_logs.append({
                "agent": "SynthesizerAgent",
                "success": synthesis_response.success,
                "metadata": synthesis_response.metadata
            })
            
            if synthesis_response.success:
                synthesized = synthesis_response.response
                result.final_response = synthesized.answer
                result.confidence = synthesized.confidence
                result.sources_used = synthesized.sources_used
                result.key_insights = synthesized.key_insights
                result.success = True
            else:
                result.error = synthesis_response.error
            
            result.execution_time = (datetime.now() - start_time).total_seconds()
            
        except Exception as e:
            logger.error(f"Simple orchestration error: {e}")
            result.error = str(e)
            result.success = False
        
        return result
    
    def _determine_synthesis_type(self, classification: Dict[str, Any]) -> str:
        """
        Determine the type of synthesis based on query classification.
        """
        query_type = classification.get("query_type", "")
        complexity = classification.get("complexity_score", 1)
        
        if complexity >= 7 or query_type == "multi_step_complex":
            return "strategic"
        elif complexity >= 4 or query_type in ["aggregation_analysis", "trend_analysis"]:
            return "analytical"
        else:
            return "standard"
    
    def _chunk_text(self, text: str, chunk_size: int) -> List[str]:
        """
        Split text into chunks for streaming.
        """
        words = text.split()
        chunks = []
        current_chunk = []
        
        for word in words:
            current_chunk.append(word)
            if len(' '.join(current_chunk)) >= chunk_size:
                chunks.append(' '.join(current_chunk) + ' ')
                current_chunk = []
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Get performance metrics for all agents.
        """
        return {
            "router": self.router.get_performance_metrics(),
            "retriever": self.retriever.get_performance_metrics(),
            "synthesizer": self.synthesizer.get_performance_metrics()
        }
    
    def reset_all_metrics(self):
        """
        Reset performance metrics for all agents.
        """
        self.router.reset_metrics()
        self.retriever.reset_metrics()
        self.synthesizer.reset_metrics()
        logger.info("Reset all agent performance metrics")
