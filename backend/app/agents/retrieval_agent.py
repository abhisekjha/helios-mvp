"""
Retrieval Agent for Helios Multi-Agent System

The Retrieval Agent is responsible for:
- Advanced vector search and data retrieval
- Query optimization and reformulation
- Data source selection and management
- Aggregation and calculation operations
"""

import logging
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from pydantic import BaseModel

from .base_agent import BaseAgent, AgentResponse
from ..services.vector_embeddings import VectorEmbeddingService

logger = logging.getLogger(__name__)


class RetrievalResult(BaseModel):
    """Result from data retrieval operations"""
    data: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    search_quality: float  # 0-1 score
    total_chunks: int
    retrieved_chunks: int


class RetrievalAgent(BaseAgent):
    """
    Retrieval Agent handles all data access and retrieval operations.
    
    This agent specializes in:
    1. Vector similarity search optimization
    2. Query reformulation for better results
    3. Data aggregation and calculations
    4. Multi-source data integration
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__("RetrievalAgent", config)
        self.vector_service = None  # Will be initialized when database is available
        
        # Retrieval configuration
        self.max_chunks = config.get("max_chunks", 10) if config else 10
        self.similarity_threshold = config.get("similarity_threshold", 0.7) if config else 0.7
        self.query_expansion = config.get("query_expansion", True) if config else True
    
    def set_vector_service(self, vector_service: VectorEmbeddingService):
        """Set the vector service when database is available"""
        self.vector_service = vector_service
    
    async def process(self, query: str, context: Dict[str, Any]) -> AgentResponse:
        """
        Process retrieval request with optimization and aggregation.
        
        Args:
            query: The search query or data request
            context: Context including goal_id, action type
            
        Returns:
            AgentResponse with retrieved data and metadata
        """
        try:
            if not self.vector_service:
                raise ValueError("Vector service not initialized. Call set_vector_service() first.")
            
            goal_id = context.get("goal_id")
            action = context.get("action", "vector_search")
            
            if action == "vector_search":
                result = self._perform_vector_search(query, goal_id)
            elif action == "aggregate_data":
                result = self._aggregate_data(query, goal_id, context)
            else:
                result = self._perform_vector_search(query, goal_id)
            
            return AgentResponse(
                agent_name=self.agent_name,
                success=True,
                response=result,
                metadata={
                    "action": action,
                    "goal_id": goal_id,
                    "search_quality": result.search_quality,
                    "chunks_retrieved": result.retrieved_chunks
                },
                execution_time=0.0  # Will be set by BaseAgent.execute
            )
            
        except Exception as e:
            logger.error(f"Retrieval Agent error: {str(e)}")
            raise
    
    def _perform_vector_search(self, query: str, goal_id: str) -> RetrievalResult:
        """
        Perform optimized vector similarity search.
        """
        try:
            # Step 1: Try original query
            results = self.vector_service.search_knowledge_base(
                goal_id=goal_id,
                query=query,
                top_k=self.max_chunks
            )
            
            search_quality = self._calculate_search_quality(results)
            
            # Step 2: If quality is low and query expansion is enabled, try reformulated queries
            if search_quality < 0.5 and self.query_expansion:
                logger.info("Low search quality, attempting query expansion")
                expanded_results = self._expand_and_search(query, goal_id)
                
                if expanded_results and len(expanded_results) > len(results):
                    results = expanded_results
                    search_quality = self._calculate_search_quality(results)
            
            # Step 3: Format results
            formatted_data = []
            for result in results:
                formatted_data.append({
                    "content": result.get("content", ""),
                    "metadata": result.get("metadata", {}),
                    "similarity_score": result.get("score", 0.0),
                    "chunk_id": result.get("chunk_id", ""),
                    "source": result.get("source", "")
                })
            
            return RetrievalResult(
                data=formatted_data,
                metadata={
                    "query": query,
                    "goal_id": goal_id,
                    "search_method": "vector_similarity",
                    "expansion_used": search_quality < 0.5 and self.query_expansion
                },
                search_quality=search_quality,
                total_chunks=self._get_total_chunks(goal_id),
                retrieved_chunks=len(formatted_data)
            )
            
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            # Return empty result instead of failing
            return RetrievalResult(
                data=[],
                metadata={"error": str(e), "query": query},
                search_quality=0.0,
                total_chunks=0,
                retrieved_chunks=0
            )
    
    def _expand_and_search(self, original_query: str, goal_id: str) -> List[Dict[str, Any]]:
        """
        Expand query with synonyms and related terms for better retrieval.
        """
        # Generate alternative queries
        expanded_queries = self._generate_query_variations(original_query)
        
        all_results = []
        seen_chunks = set()
        
        for query_variant in expanded_queries:
            try:
                results = self.vector_service.search_knowledge_base(
                    goal_id=goal_id,
                    query=query_variant,
                    top_k=5  # Fewer results per variant
                )
                
                # Deduplicate based on chunk content
                for result in results:
                    chunk_id = result.get("chunk_id", "")
                    if chunk_id not in seen_chunks:
                        seen_chunks.add(chunk_id)
                        all_results.append(result)
                        
            except Exception as e:
                logger.warning(f"Query variant '{query_variant}' failed: {e}")
                continue
        
        # Sort by similarity score
        all_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        return all_results[:self.max_chunks]
    
    def _generate_query_variations(self, query: str) -> List[str]:
        """
        Generate variations of the query for better retrieval coverage.
        """
        variations = [query]  # Always include original
        
        # Simple keyword expansion based on business terms
        business_synonyms = {
            "sales": ["revenue", "income", "earnings"],
            "profit": ["earnings", "margin", "return"],
            "customer": ["client", "buyer", "consumer"],
            "product": ["item", "merchandise", "offering"],
            "price": ["cost", "rate", "amount"],
            "date": ["time", "period", "when"],
            "increase": ["growth", "rise", "improvement"],
            "decrease": ["decline", "drop", "reduction"]
        }
        
        query_lower = query.lower()
        for word, synonyms in business_synonyms.items():
            if word in query_lower:
                for synonym in synonyms:
                    variant = query_lower.replace(word, synonym)
                    if variant != query_lower:
                        variations.append(variant)
        
        # Add more focused versions
        if len(query.split()) > 3:
            # Try shorter, more focused queries
            words = query.split()
            # Take first and last parts
            focused = " ".join(words[:2] + words[-2:])
            variations.append(focused)
        
        return list(set(variations))  # Remove duplicates
    
    def _aggregate_data(self, query: str, goal_id: str, context: Dict[str, Any]) -> RetrievalResult:
        """
        Perform data aggregation operations.
        """
        try:
            # First, get all relevant data
            search_results = self._perform_vector_search(query, goal_id)
            
            if not search_results.data:
                return search_results  # Return empty result
            
            # Convert to DataFrame for aggregation
            df_data = []
            for item in search_results.data:
                content = item.get("content", "")
                # Parse structured data from content if possible
                parsed_data = self._parse_structured_data(content)
                if parsed_data:
                    df_data.extend(parsed_data)
            
            if not df_data:
                return search_results  # Return original if no structured data
            
            df = pd.DataFrame(df_data)
            
            # Perform aggregations based on query intent
            aggregated_data = self._perform_aggregations(df, query)
            
            return RetrievalResult(
                data=aggregated_data,
                metadata={
                    "query": query,
                    "goal_id": goal_id,
                    "operation": "aggregation",
                    "original_rows": len(df_data),
                    "aggregated_results": len(aggregated_data)
                },
                search_quality=search_results.search_quality,
                total_chunks=search_results.total_chunks,
                retrieved_chunks=len(aggregated_data)
            )
            
        except Exception as e:
            logger.error(f"Data aggregation failed: {e}")
            # Fallback to original search results
            return self._perform_vector_search(query, goal_id)
    
    def _parse_structured_data(self, content: str) -> List[Dict[str, Any]]:
        """
        Parse structured data from content text.
        """
        try:
            # Look for patterns like "Column: Value" or "Key=Value"
            data_rows = []
            lines = content.split('\n')
            
            current_row = {}
            for line in lines:
                line = line.strip()
                if not line:
                    if current_row:
                        data_rows.append(current_row)
                        current_row = {}
                    continue
                
                # Try different patterns
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Try to convert to appropriate type
                    try:
                        if value.replace('.', '').isdigit():
                            value = float(value) if '.' in value else int(value)
                    except:
                        pass  # Keep as string
                    
                    current_row[key] = value
            
            # Add last row if exists
            if current_row:
                data_rows.append(current_row)
            
            return data_rows
            
        except Exception as e:
            logger.warning(f"Failed to parse structured data: {e}")
            return []
    
    def _perform_aggregations(self, df: pd.DataFrame, query: str) -> List[Dict[str, Any]]:
        """
        Perform aggregations based on query intent.
        """
        query_lower = query.lower()
        results = []
        
        try:
            # Identify numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            
            if "sum" in query_lower or "total" in query_lower:
                for col in numeric_cols:
                    results.append({
                        "metric": f"Total {col}",
                        "value": float(df[col].sum()),
                        "type": "sum"
                    })
            
            if "average" in query_lower or "mean" in query_lower:
                for col in numeric_cols:
                    results.append({
                        "metric": f"Average {col}",
                        "value": float(df[col].mean()),
                        "type": "average"
                    })
            
            if "count" in query_lower:
                results.append({
                    "metric": "Total Records",
                    "value": len(df),
                    "type": "count"
                })
            
            if "max" in query_lower or "maximum" in query_lower:
                for col in numeric_cols:
                    results.append({
                        "metric": f"Maximum {col}",
                        "value": float(df[col].max()),
                        "type": "maximum"
                    })
            
            if "min" in query_lower or "minimum" in query_lower:
                for col in numeric_cols:
                    results.append({
                        "metric": f"Minimum {col}",
                        "value": float(df[col].min()),
                        "type": "minimum"
                    })
            
            # If no specific aggregation found, provide summary statistics
            if not results:
                for col in numeric_cols:
                    results.extend([
                        {"metric": f"Average {col}", "value": float(df[col].mean()), "type": "average"},
                        {"metric": f"Total {col}", "value": float(df[col].sum()), "type": "sum"},
                        {"metric": f"Count {col}", "value": int(df[col].count()), "type": "count"}
                    ])
            
            return results
            
        except Exception as e:
            logger.error(f"Aggregation calculation failed: {e}")
            return [{"error": str(e), "metric": "aggregation_failed", "value": 0}]
    
    def _calculate_search_quality(self, results: List[Dict[str, Any]]) -> float:
        """
        Calculate search quality based on similarity scores and result count.
        """
        if not results:
            return 0.0
        
        # Average similarity score
        scores = [r.get("score", 0.0) for r in results]
        avg_score = sum(scores) / len(scores)
        
        # Boost quality if we have enough results
        result_bonus = min(len(results) / self.max_chunks, 1.0) * 0.2
        
        return min(avg_score + result_bonus, 1.0)
    
    def _get_total_chunks(self, goal_id: str) -> int:
        """
        Get total number of chunks available for this goal.
        """
        try:
            # This would need to be implemented based on your knowledge base structure
            # For now, return an estimated count
            return 100  # Placeholder
        except:
            return 0
