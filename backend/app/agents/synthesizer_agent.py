"""
Synthesizer Agent for Helios Multi-Agent System

The Synthesizer Agent is responsible for:
- Response synthesis from multiple data sources
- Context aggregation and reasoning
- Answer quality improvement and coherence
- Formatting and presentation of final responses
"""

import logging
from typing import Any, Dict, List, Optional
import openai
from pydantic import BaseModel

from .base_agent import BaseAgent, AgentResponse
from ..core.config import settings

logger = logging.getLogger(__name__)


class SynthesisRequest(BaseModel):
    """Request for synthesis operations"""
    query: str
    retrieved_data: List[Dict[str, Any]]
    context: Dict[str, Any]
    synthesis_type: str = "standard"  # standard, analytical, strategic


class SynthesizedResponse(BaseModel):
    """Synthesized response with metadata"""
    answer: str
    confidence: float
    sources_used: List[str]
    key_insights: List[str]
    data_summary: Dict[str, Any]
    recommendations: Optional[List[str]] = None


class SynthesizerAgent(BaseAgent):
    """
    Synthesizer Agent handles response generation and context aggregation.
    
    This agent specializes in:
    1. Combining information from multiple sources
    2. Generating coherent and comprehensive responses
    3. Adding strategic insights and recommendations
    4. Ensuring response quality and accuracy
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__("SynthesizerAgent", config)
        self.client = openai.OpenAI(api_key=settings.LLM_API_KEY)
        
        # Synthesis configuration
        self.max_tokens = config.get("max_tokens", 1000) if config else 1000
        self.temperature = config.get("temperature", 0.3) if config else 0.3
        self.include_recommendations = config.get("include_recommendations", True) if config else True
    
    async def process(self, query: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Process synthesis request and generate comprehensive response.
        
        Args:
            query: Original user query
            context: Context including retrieved_data and synthesis_type
            
        Returns:
            AgentResponse with synthesized response
        """
        try:
            retrieved_data = context.get("retrieved_data", [])
            synthesis_type = context.get("synthesis_type", "standard")
            
            if not retrieved_data:
                # Handle empty data case
                response = await self._handle_no_data_response(query, context)
            else:
                # Synthesize response from data
                response = await self._synthesize_response(query, retrieved_data, synthesis_type, context)
            
            return AgentResponse(
                agent_name=self.agent_name,
                success=True,
                response=response,
                metadata={
                    "synthesis_type": synthesis_type,
                    "sources_count": len(retrieved_data),
                    "confidence": response.confidence
                },
                execution_time=0.0  # Will be set by BaseAgent.execute
            )
            
        except Exception as e:
            logger.error(f"Synthesizer Agent error: {str(e)}")
            raise
    
    async def _synthesize_response(self, query: str, retrieved_data: List[Dict[str, Any]], 
                                 synthesis_type: str, context: Dict[str, Any]) -> SynthesizedResponse:
        """
        Synthesize comprehensive response from retrieved data.
        """
        try:
            # Step 1: Analyze and summarize the data
            data_summary = self._analyze_retrieved_data(retrieved_data)
            
            # Step 2: Generate the main response
            main_response = await self._generate_main_response(query, retrieved_data, synthesis_type)
            
            # Step 3: Extract key insights
            key_insights = await self._extract_key_insights(retrieved_data, query)
            
            # Step 4: Generate recommendations if enabled
            recommendations = None
            if self.include_recommendations and synthesis_type in ["analytical", "strategic"]:
                recommendations = await self._generate_recommendations(query, retrieved_data, data_summary)
            
            # Step 5: Calculate confidence score
            confidence = self._calculate_confidence(retrieved_data, main_response)
            
            # Step 6: Identify sources
            sources_used = self._identify_sources(retrieved_data)
            
            return SynthesizedResponse(
                answer=main_response,
                confidence=confidence,
                sources_used=sources_used,
                key_insights=key_insights,
                data_summary=data_summary,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Response synthesis failed: {e}")
            # Fallback to simple response
            return await self._create_fallback_response(query, retrieved_data)
    
    async def _generate_main_response(self, query: str, retrieved_data: List[Dict[str, Any]], 
                                    synthesis_type: str) -> str:
        """
        Generate the main response using OpenAI.
        """
        # Prepare context from retrieved data
        context_chunks = []
        for item in retrieved_data[:10]:  # Limit to top 10 results
            content = item.get("content", "")
            score = item.get("similarity_score", 0)
            context_chunks.append(f"[Relevance: {score:.2f}] {content}")
        
        context_text = "\n\n".join(context_chunks)
        
        # Create system prompt based on synthesis type
        if synthesis_type == "analytical":
            system_prompt = """You are a senior business analyst. Analyze the provided data and give a comprehensive, analytical response. Include specific numbers, trends, and insights. Focus on what the data reveals about business performance."""
        elif synthesis_type == "strategic":
            system_prompt = """You are a strategic business consultant. Provide strategic insights and actionable recommendations based on the data. Focus on implications and next steps for business growth."""
        else:
            system_prompt = """You are a helpful business data assistant. Provide clear, accurate answers based on the provided data. Be specific and reference the actual data points when possible."""
        
        user_prompt = f"""Based on the following data, please answer this question: {query}

Available Data:
{context_text}

Provide a comprehensive response that:
1. Directly answers the question
2. References specific data points
3. Explains any patterns or trends observed
4. Is clear and actionable

Response:"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"OpenAI response generation failed: {e}")
            return self._create_simple_response(query, retrieved_data)
    
    async def _extract_key_insights(self, retrieved_data: List[Dict[str, Any]], query: str) -> List[str]:
        """
        Extract key insights from the retrieved data.
        """
        insights = []
        
        try:
            # Analyze data for patterns
            if retrieved_data:
                # Basic insights based on data patterns
                insights.append(f"Found {len(retrieved_data)} relevant data points")
                
                # Look for numeric patterns if aggregated data is present
                for item in retrieved_data:
                    if isinstance(item.get("value"), (int, float)):
                        metric = item.get("metric", "")
                        value = item.get("value")
                        insights.append(f"{metric}: {value:,.2f}")
                
                # Add data quality insight
                scores = [item.get("similarity_score", 0) for item in retrieved_data]
                if scores:
                    avg_relevance = sum(scores) / len(scores)
                    if avg_relevance > 0.8:
                        insights.append("High data relevance - results are highly pertinent to your query")
                    elif avg_relevance > 0.6:
                        insights.append("Good data relevance - results are generally relevant")
                    else:
                        insights.append("Moderate data relevance - some results may be tangential")
            
            return insights[:5]  # Limit to top 5 insights
            
        except Exception as e:
            logger.error(f"Insight extraction failed: {e}")
            return ["Analysis of key patterns in your data"]
    
    async def _generate_recommendations(self, query: str, retrieved_data: List[Dict[str, Any]], 
                                      data_summary: Dict[str, Any]) -> List[str]:
        """
        Generate strategic recommendations based on the data.
        """
        try:
            # Prepare context for recommendation generation
            context_summary = f"""
            Query: {query}
            Data Points: {len(retrieved_data)}
            Key Metrics: {data_summary.get('metrics_summary', 'N/A')}
            """
            
            prompt = f"""Based on this business data analysis, provide 3-5 specific, actionable recommendations:

{context_summary}

Focus on:
1. Immediate actions that can be taken
2. Areas for improvement or optimization
3. Strategic opportunities identified
4. Risk mitigation strategies

Recommendations:"""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a strategic business consultant providing actionable recommendations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=400
            )
            
            # Parse recommendations into list
            recommendations_text = response.choices[0].message.content.strip()
            recommendations = []
            
            for line in recommendations_text.split('\n'):
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•') or line.startswith(('1.', '2.', '3.', '4.', '5.'))):
                    # Clean up the recommendation
                    recommendation = line.lstrip('-•123456789. ').strip()
                    if recommendation:
                        recommendations.append(recommendation)
            
            return recommendations[:5]  # Limit to 5 recommendations
            
        except Exception as e:
            logger.error(f"Recommendation generation failed: {e}")
            return ["Continue monitoring data trends", "Consider additional data analysis", "Review performance metrics regularly"]
    
    def _analyze_retrieved_data(self, retrieved_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze retrieved data to create summary statistics.
        """
        try:
            summary = {
                "total_items": len(retrieved_data),
                "data_types": {},
                "metrics_summary": {},
                "quality_score": 0.0
            }
            
            # Analyze data types and content
            for item in retrieved_data:
                if "type" in item:
                    data_type = item["type"]
                    summary["data_types"][data_type] = summary["data_types"].get(data_type, 0) + 1
                
                # If it's aggregated data, capture metrics
                if "metric" in item and "value" in item:
                    metric = item["metric"]
                    value = item["value"]
                    summary["metrics_summary"][metric] = value
            
            # Calculate quality score based on similarity scores
            scores = [item.get("similarity_score", 0) for item in retrieved_data if "similarity_score" in item]
            if scores:
                summary["quality_score"] = sum(scores) / len(scores)
            
            return summary
            
        except Exception as e:
            logger.error(f"Data analysis failed: {e}")
            return {"total_items": len(retrieved_data), "error": str(e)}
    
    def _calculate_confidence(self, retrieved_data: List[Dict[str, Any]], response: str) -> float:
        """
        Calculate confidence score for the synthesized response.
        """
        try:
            confidence_factors = []
            
            # Factor 1: Data quantity
            data_quantity_score = min(len(retrieved_data) / 5, 1.0)  # Normalize to 1.0
            confidence_factors.append(data_quantity_score)
            
            # Factor 2: Data quality (similarity scores)
            scores = [item.get("similarity_score", 0) for item in retrieved_data if "similarity_score" in item]
            if scores:
                quality_score = sum(scores) / len(scores)
                confidence_factors.append(quality_score)
            
            # Factor 3: Response length (longer responses generally indicate more comprehensive analysis)
            response_length_score = min(len(response) / 500, 1.0)  # Normalize to 1.0
            confidence_factors.append(response_length_score)
            
            # Factor 4: Presence of specific data references
            specific_data_score = 0.8 if any(char.isdigit() for char in response) else 0.4
            confidence_factors.append(specific_data_score)
            
            # Calculate weighted average
            return sum(confidence_factors) / len(confidence_factors)
            
        except Exception as e:
            logger.error(f"Confidence calculation failed: {e}")
            return 0.5  # Default moderate confidence
    
    def _identify_sources(self, retrieved_data: List[Dict[str, Any]]) -> List[str]:
        """
        Identify and list data sources used in the response.
        """
        sources = set()
        
        for item in retrieved_data:
            source = item.get("source", "")
            if source:
                sources.add(source)
            
            # Also check metadata for source information
            metadata = item.get("metadata", {})
            if isinstance(metadata, dict):
                metadata_source = metadata.get("source", "")
                if metadata_source:
                    sources.add(metadata_source)
        
        # If no specific sources found, provide generic description
        if not sources:
            sources.add("Uploaded CSV data")
        
        return list(sources)
    
    async def _handle_no_data_response(self, query: str, context: Dict[str, Any]) -> SynthesizedResponse:
        """
        Handle cases where no relevant data was found.
        """
        return SynthesizedResponse(
            answer=f"I couldn't find specific data to answer your question: '{query}'. This might be because:\n\n"
                   f"1. The uploaded data doesn't contain information relevant to your query\n"
                   f"2. You may need to upload additional data files\n"
                   f"3. Try rephrasing your question with different keywords\n\n"
                   f"Please consider uploading more data or asking about topics covered in your existing data.",
            confidence=0.2,
            sources_used=["No relevant data found"],
            key_insights=["No data available for analysis"],
            data_summary={"total_items": 0, "error": "No relevant data found"},
            recommendations=["Upload relevant data files", "Try different search terms", "Check data upload status"]
        )
    
    async def _create_fallback_response(self, query: str, retrieved_data: List[Dict[str, Any]]) -> SynthesizedResponse:
        """
        Create a simple fallback response when synthesis fails.
        """
        simple_response = self._create_simple_response(query, retrieved_data)
        
        return SynthesizedResponse(
            answer=simple_response,
            confidence=0.4,  # Lower confidence for fallback
            sources_used=self._identify_sources(retrieved_data),
            key_insights=[f"Found {len(retrieved_data)} relevant data points"],
            data_summary={"total_items": len(retrieved_data), "fallback": True}
        )
    
    def _create_simple_response(self, query: str, retrieved_data: List[Dict[str, Any]]) -> str:
        """
        Create a simple response without OpenAI when synthesis fails.
        """
        if not retrieved_data:
            return f"I couldn't find specific data to answer your question about: {query}"
        
        response_parts = [f"Based on your query '{query}', I found {len(retrieved_data)} relevant data points:"]
        
        # Add top few results
        for i, item in enumerate(retrieved_data[:3]):
            content = item.get("content", "No content")
            score = item.get("similarity_score", 0)
            response_parts.append(f"\n{i+1}. {content[:200]}... (Relevance: {score:.2f})")
        
        if len(retrieved_data) > 3:
            response_parts.append(f"\n... and {len(retrieved_data) - 3} more results.")
        
        return "\n".join(response_parts)
