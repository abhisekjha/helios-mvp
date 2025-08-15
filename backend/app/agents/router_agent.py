"""
Router Agent for Helios Multi-Agent System

The Router Agent is responsible for:
- Classifying incoming queries by intent and complexity
- Selecting appropriate tools and agents for query handling
- Breaking down complex multi-step queries
- Orchestrating the overall query processing workflow
"""

import logging
from typing import Any, Dict, List, Optional
from enum import Enum
import openai
from pydantic import BaseModel

from .base_agent import BaseAgent, AgentResponse
from ..core.config import settings

logger = logging.getLogger(__name__)


class QueryType(Enum):
    """Classification of query types"""
    SIMPLE_DATA_LOOKUP = "simple_data_lookup"
    AGGREGATION_ANALYSIS = "aggregation_analysis"
    TREND_ANALYSIS = "trend_analysis"
    COMPARISON_QUERY = "comparison_query"
    MULTI_STEP_COMPLEX = "multi_step_complex"
    PLANNING_REQUEST = "planning_request"
    GENERAL_QUESTION = "general_question"


class QueryClassification(BaseModel):
    """Result of query classification"""
    query_type: QueryType
    confidence: float
    intent: str
    entities: List[str]
    requires_tools: List[str]
    complexity_score: int  # 1-10, where 10 is most complex
    estimated_steps: int


class RouterAgent(BaseAgent):
    """
    Router Agent handles query classification and orchestration.
    
    This agent analyzes incoming queries and determines:
    1. What type of query it is
    2. Which tools/agents are needed
    3. How to break down complex queries
    4. The optimal processing strategy
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__("RouterAgent", config)
        self.client = openai.OpenAI(api_key=settings.LLM_API_KEY)
        
        # Define available tools and their capabilities
        self.available_tools = {
            "vector_search": {
                "description": "Search uploaded data using semantic similarity",
                "use_cases": ["data lookup", "finding specific information", "context retrieval"]
            },
            "data_aggregation": {
                "description": "Perform calculations and aggregations on data",
                "use_cases": ["sum", "average", "count", "group by operations"]
            },
            "trend_analysis": {
                "description": "Analyze patterns and trends over time",
                "use_cases": ["time series analysis", "growth patterns", "seasonal trends"]
            },
            "comparison": {
                "description": "Compare different data points or periods",
                "use_cases": ["before/after", "A vs B comparisons", "performance comparison"]
            },
            "insights_generation": {
                "description": "Generate strategic insights from data",
                "use_cases": ["business recommendations", "strategic analysis"]
            }
        }
    
    async def process(self, query: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Process incoming query and determine routing strategy.
        
        Args:
            query: User's question or request
            context: Context including goal_id, conversation history
            
        Returns:
            AgentResponse with classification and routing information
        """
        try:
            # Step 1: Classify the query
            classification = await self._classify_query(query, context)
            
            # Step 2: Determine processing strategy
            strategy = await self._determine_strategy(classification, query, context)
            
            # Step 3: Create execution plan
            execution_plan = await self._create_execution_plan(strategy, classification, query)
            
            return AgentResponse(
                agent_name=self.agent_name,
                success=True,
                response={
                    "classification": classification.dict(),
                    "strategy": strategy,
                    "execution_plan": execution_plan,
                    "recommended_agents": self._get_recommended_agents(classification),
                    "estimated_complexity": classification.complexity_score
                },
                metadata={
                    "query_type": classification.query_type.value,
                    "confidence": classification.confidence,
                    "tools_needed": classification.requires_tools
                },
                execution_time=0.0  # Will be set by BaseAgent.execute
            )
            
        except Exception as e:
            logger.error(f"Router Agent error: {str(e)}")
            raise
    
    async def _classify_query(self, query: str, context: Dict[str, Any]) -> QueryClassification:
        """
        Use OpenAI to classify the query and extract relevant information.
        """
        system_prompt = f"""You are an expert query classifier for a business analytics system.

Available tools: {', '.join(self.available_tools.keys())}

Analyze the user's query and classify it according to these types:
- simple_data_lookup: Looking for specific data points
- aggregation_analysis: Requires calculations (sum, average, count, etc.)
- trend_analysis: Looking for patterns over time
- comparison_query: Comparing different items/periods
- multi_step_complex: Requires multiple operations or reasoning steps
- planning_request: Asking for strategic advice or planning
- general_question: General questions about the data or system

Return a JSON response with:
{{
    "query_type": "one of the types above",
    "confidence": 0.0-1.0,
    "intent": "brief description of what user wants",
    "entities": ["list", "of", "key", "entities", "mentioned"],
    "requires_tools": ["list", "of", "needed", "tools"],
    "complexity_score": 1-10,
    "estimated_steps": number_of_processing_steps
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Classify this query: {query}"}
                ],
                temperature=0.1,
                max_tokens=300
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            
            return QueryClassification(
                query_type=QueryType(result["query_type"]),
                confidence=result["confidence"],
                intent=result["intent"],
                entities=result["entities"],
                requires_tools=result["requires_tools"],
                complexity_score=result["complexity_score"],
                estimated_steps=result["estimated_steps"]
            )
            
        except Exception as e:
            logger.warning(f"Query classification failed, using fallback: {e}")
            # Fallback classification based on simple keyword analysis
            return self._fallback_classification(query)
    
    def _fallback_classification(self, query: str) -> QueryClassification:
        """Simple fallback classification when AI fails"""
        query_lower = query.lower()
        
        # Simple keyword-based classification
        if any(word in query_lower for word in ["what is", "show me", "find"]):
            query_type = QueryType.SIMPLE_DATA_LOOKUP
            complexity = 2
        elif any(word in query_lower for word in ["average", "sum", "total", "count"]):
            query_type = QueryType.AGGREGATION_ANALYSIS
            complexity = 4
        elif any(word in query_lower for word in ["trend", "over time", "growth", "change"]):
            query_type = QueryType.TREND_ANALYSIS
            complexity = 6
        elif any(word in query_lower for word in ["compare", "vs", "versus", "difference"]):
            query_type = QueryType.COMPARISON_QUERY
            complexity = 5
        else:
            query_type = QueryType.GENERAL_QUESTION
            complexity = 3
        
        return QueryClassification(
            query_type=query_type,
            confidence=0.6,  # Lower confidence for fallback
            intent="Analyze user query",
            entities=[],
            requires_tools=["vector_search"],
            complexity_score=complexity,
            estimated_steps=1
        )
    
    async def _determine_strategy(self, classification: QueryClassification, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Determine the processing strategy based on classification.
        """
        if classification.query_type == QueryType.SIMPLE_DATA_LOOKUP:
            return {
                "type": "direct_retrieval",
                "approach": "Use vector search to find relevant data",
                "parallel_processing": False
            }
        
        elif classification.query_type == QueryType.AGGREGATION_ANALYSIS:
            return {
                "type": "retrieve_and_aggregate",
                "approach": "First retrieve data, then perform calculations",
                "parallel_processing": False
            }
        
        elif classification.query_type == QueryType.MULTI_STEP_COMPLEX:
            return {
                "type": "sequential_processing",
                "approach": "Break down into smaller steps and process sequentially",
                "parallel_processing": False
            }
        
        else:
            return {
                "type": "standard_processing",
                "approach": "Standard retrieval and synthesis",
                "parallel_processing": False
            }
    
    async def _create_execution_plan(self, strategy: Dict[str, Any], classification: QueryClassification, query: str) -> List[Dict[str, Any]]:
        """
        Create detailed execution plan with steps.
        """
        plan = []
        
        if strategy["type"] == "direct_retrieval":
            plan.append({
                "step": 1,
                "agent": "RetrievalAgent",
                "action": "vector_search",
                "description": "Search for relevant data",
                "input": query
            })
            plan.append({
                "step": 2,
                "agent": "SynthesizerAgent",
                "action": "synthesize_response",
                "description": "Format and present results",
                "input": "retrieval_results"
            })
        
        elif strategy["type"] == "retrieve_and_aggregate":
            plan.append({
                "step": 1,
                "agent": "RetrievalAgent",
                "action": "vector_search",
                "description": "Retrieve relevant data for aggregation",
                "input": query
            })
            plan.append({
                "step": 2,
                "agent": "RetrievalAgent",
                "action": "aggregate_data",
                "description": "Perform requested calculations",
                "input": "raw_data"
            })
            plan.append({
                "step": 3,
                "agent": "SynthesizerAgent",
                "action": "synthesize_response",
                "description": "Present aggregated results with insights",
                "input": "aggregated_data"
            })
        
        else:
            # Default plan
            plan.append({
                "step": 1,
                "agent": "RetrievalAgent",
                "action": "vector_search",
                "description": "Search for relevant information",
                "input": query
            })
            plan.append({
                "step": 2,
                "agent": "SynthesizerAgent",
                "action": "synthesize_response",
                "description": "Generate comprehensive response",
                "input": "search_results"
            })
        
        return plan
    
    def _get_recommended_agents(self, classification: QueryClassification) -> List[str]:
        """
        Get list of recommended agents based on classification.
        """
        agents = ["RetrievalAgent"]  # Always needed for data access
        
        if classification.complexity_score >= 5 or classification.query_type == QueryType.MULTI_STEP_COMPLEX:
            agents.append("SynthesizerAgent")
        
        if classification.query_type in [QueryType.TREND_ANALYSIS, QueryType.COMPARISON_QUERY]:
            agents.append("SynthesizerAgent")  # Need advanced synthesis
        
        return list(set(agents))  # Remove duplicates
