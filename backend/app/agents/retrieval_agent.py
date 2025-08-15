"""
Retrieval Agent for Helios Multi-Agent System

The Retrieval Agent is responsible for:
- Advanced vector search and data retrieval
- Query optimization and reformulation
- Data source selection and management
- Aggregation and calculation operations
"""

import logging
import os
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from pydantic import BaseModel

from .base_agent import BaseAgent, AgentResponse
from ..services.vector_embeddings import VectorEmbeddingService
from ..crud import crud_data_upload
from ..db.session import get_database

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
        Perform optimized vector similarity search including CSV data.
        """
        try:
            formatted_data = []
            search_quality = 0.0
            
            # Step 1: Try vector search first
            try:
                results = self.vector_service.search_knowledge_base(
                    goal_id=goal_id,
                    query=query,
                    top_k=self.max_chunks
                )
                
                search_quality = self._calculate_search_quality(results)
                logger.info(f"Vector search found {len(results)} results, quality: {search_quality:.2f}")
                
                # Step 2: If quality is low and query expansion is enabled, try reformulated queries
                if search_quality < 0.5 and self.query_expansion:
                    logger.info("Low search quality, attempting query expansion")
                    expanded_results = self._expand_and_search(query, goal_id)
                    
                    if expanded_results and len(expanded_results) > len(results):
                        results = expanded_results
                        search_quality = self._calculate_search_quality(results)
                
                # Format vector results
                for result in results:
                    formatted_data.append({
                        "content": result.get("content", ""),
                        "metadata": result.get("metadata", {}),
                        "similarity_score": result.get("score", 0.0),
                        "chunk_id": result.get("chunk_id", ""),
                        "source": result.get("source", "vector_db"),
                        "type": "vector_search"
                    })
            except Exception as e:
                logger.warning(f"Vector search failed: {e}")
            
            # Step 3: ALWAYS try to get uploaded CSV data for the goal
            csv_data = self._get_uploaded_csv_data(goal_id, query)
            logger.info(f"CSV data retrieval: found {len(csv_data) if csv_data else 0} chunks")
            if csv_data:
                for i, chunk in enumerate(csv_data[:2]):  # Log first 2 CSV chunks
                    chunk_type = chunk.get("type", "unknown")
                    content_len = len(chunk.get("content", ""))
                    insights_count = len(chunk.get("data_insights", []))
                    logger.info(f"  CSV chunk {i+1}: type={chunk_type}, content_len={content_len}, insights={insights_count}")
                
                formatted_data.extend(csv_data)
                logger.info(f"After CSV merge: total {len(formatted_data)} items")
                
                # Debug: Check what extend actually added
                logger.info(f"🔍 DEBUG EXTEND - csv_data before extend:")
                for i, item in enumerate(csv_data[:2]):
                    logger.info(f"  csv_data item {i+1}: type={item.get('type')}, content_len={len(item.get('content', ''))}, insights={len(item.get('data_insights', []))}")
                
                logger.info(f"🔍 DEBUG EXTEND - formatted_data after extend:")
                for i, item in enumerate(formatted_data[-2:]):  # Last 2 items (should be CSV)
                    logger.info(f"  formatted_data item {i+1}: type={item.get('type')}, content_len={len(item.get('content', ''))}, insights={len(item.get('data_insights', []))}")
                
                # Debug: Check final data types
                csv_count = sum(1 for item in formatted_data if item.get("type") == "csv_data")
                vector_count = sum(1 for item in formatted_data if item.get("type") == "vector_search")
                logger.info(f"Final data breakdown: {csv_count} CSV items, {vector_count} vector items")
                
                # Boost search quality if we found CSV data
                search_quality = max(search_quality, 0.8)
            
            # Final debug: Check formatted_data right before return
            logger.info(f"🔍 FINAL CHECK before return - formatted_data:")
            final_csv_count = sum(1 for item in formatted_data if item.get("type") == "csv_data")
            final_vector_count = sum(1 for item in formatted_data if item.get("type") == "vector_search")
            logger.info(f"  Return data: {final_csv_count} CSV items, {final_vector_count} vector items, total={len(formatted_data)}")
            
            # Check different positions in the list
            logger.info(f"  FIRST 3 items:")
            for i, item in enumerate(formatted_data[:3]):
                logger.info(f"    Item {i+1}: type={item.get('type')}, content_len={len(item.get('content', ''))}, insights={len(item.get('data_insights', []))}")
            
            logger.info(f"  LAST 3 items:")
            for i, item in enumerate(formatted_data[-3:]):
                logger.info(f"    Item {len(formatted_data)-2+i}: type={item.get('type')}, content_len={len(item.get('content', ''))}, insights={len(item.get('data_insights', []))}")
            
            return RetrievalResult(
                data=formatted_data,
                metadata={
                    "query": query,
                    "goal_id": goal_id,
                    "search_method": "hybrid_vector_csv",
                    "expansion_used": search_quality < 0.5 and self.query_expansion,
                    "csv_data_found": len(csv_data) > 0 if csv_data else False
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
        Perform data aggregation operations while preserving CSV insights.
        """
        try:
            # First, get all relevant data
            search_results = self._perform_vector_search(query, goal_id)
            
            if not search_results.data:
                return search_results  # Return empty result
            
            # For planning/strategic queries, preserve the original CSV insights
            # since they already contain rich business intelligence
            csv_items = [item for item in search_results.data if item.get("type") == "csv_data"]
            
            if csv_items:
                logger.info(f"Aggregation preserving {len(csv_items)} CSV items with rich insights")
                # Return the original data which already has enhanced CSV analysis
                return search_results
            
            # Only perform traditional aggregation if no CSV insights are available
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
    
    def _get_uploaded_csv_data(self, goal_id: str, query: str) -> List[Dict[str, Any]]:
        """
        Retrieve and analyze uploaded CSV data for the goal.
        
        Args:
            goal_id: The goal ID to search for uploaded data
            query: User query to understand what data to focus on
            
        Returns:
            List of formatted data chunks from CSV files
        """
        try:
            # Get database connection
            db = get_database()
            
            # Get all uploaded data for this goal
            uploads = crud_data_upload.get_data_uploads_by_goal(db, goal_id)
            
            if not uploads:
                logger.info(f"No uploads found for goal {goal_id}")
                return []
            
            csv_results = []
            
            for upload in uploads:
                if upload.status.value == "Complete" and upload.file_path:
                    try:
                        # Read the CSV file
                        csv_path = upload.file_path
                        if not os.path.exists(csv_path):
                            # Try alternative path
                            csv_path = os.path.join("/Users/ajha/snapdev/helios-mvp/backend", upload.file_path)
                        
                        if os.path.exists(csv_path):
                            df = pd.read_csv(csv_path)
                            
                            # Generate summary insights from the CSV
                            summary = self._analyze_csv_data(df, query, upload.file_name)
                            
                            # Add structured data chunks
                            csv_results.append({
                                "content": summary["overview"],
                                "metadata": {
                                    "file_name": upload.file_name,
                                    "upload_id": upload.id,
                                    "rows": len(df),
                                    "columns": list(df.columns),
                                    "upload_time": upload.upload_timestamp.isoformat() if upload.upload_timestamp else None
                                },
                                "similarity_score": 0.9,  # High relevance for uploaded data
                                "chunk_id": f"csv_{upload.id}",
                                "source": f"uploaded_csv_{upload.file_name}",
                                "type": "csv_data",
                                "data_insights": summary["insights"],
                                "raw_data_sample": df.head(5).to_dict('records') if len(df) > 0 else []
                            })
                            
                        else:
                            logger.warning(f"CSV file not found: {csv_path}")
                            
                    except Exception as e:
                        logger.error(f"Error processing CSV {upload.file_path}: {e}")
                        continue
            
            logger.info(f"Retrieved {len(csv_results)} CSV data chunks for goal {goal_id}")
            return csv_results
            
        except Exception as e:
            logger.error(f"Error retrieving CSV data: {e}")
            return []
    
    def _analyze_csv_data(self, df: pd.DataFrame, query: str, file_name: str) -> Dict[str, Any]:
        """
        Analyze CSV data and generate insights based on the query.
        
        Args:
            df: Pandas DataFrame with the CSV data
            query: User query to guide analysis
            file_name: Name of the file for context
            
        Returns:
            Dictionary with overview and insights
        """
        try:
            # Basic data analysis
            row_count = len(df)
            col_count = len(df.columns)
            columns = list(df.columns)
            
            # Identify numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            
            # Enhanced overview with more business context
            overview = f"Business data from '{file_name}': {row_count} records with {col_count} attributes including {', '.join(columns[:5])}{'...' if len(columns) > 5 else ''}"
            
            insights = []
            
            # ENHANCED REVENUE/SALES ANALYSIS
            revenue_keywords = ['sales', 'revenue', 'income', 'profit', 'earnings', 'amount', 'total_spent', 'cost', 'price']
            revenue_cols = [col for col in columns if any(keyword in col.lower() for keyword in revenue_keywords)]
            
            for col in revenue_cols:
                if col in numeric_cols and not df[col].isna().all():
                    total_val = df[col].sum()
                    avg_val = df[col].mean()
                    median_val = df[col].median()
                    max_val = df[col].max()
                    min_val = df[col].min()
                    
                    insights.append(f"{col} Analysis: Total ${total_val:,.0f}, Average ${avg_val:,.0f}, Range ${min_val:,.0f}-${max_val:,.0f}")
                    
                    # Growth analysis if enough data points
                    if len(df) >= 3:
                        first_quarter = df[col].iloc[:len(df)//4].mean()
                        last_quarter = df[col].iloc[-len(df)//4:].mean()
                        if first_quarter > 0:
                            growth = ((last_quarter - first_quarter) / first_quarter) * 100
                            insights.append(f"{col} Trend: {growth:+.1f}% change from early to recent period")
            
            # CUSTOMER ANALYSIS
            customer_keywords = ['customer', 'client', 'user', 'segment', 'churn', 'retention']
            customer_cols = [col for col in columns if any(keyword in col.lower() for keyword in customer_keywords)]
            
            if customer_cols:
                # Customer segmentation
                if 'Customer_Segment' in columns or 'customer_segment' in columns:
                    seg_col = 'Customer_Segment' if 'Customer_Segment' in columns else 'customer_segment'
                    segments = df[seg_col].value_counts()
                    insights.append(f"Customer Segments: {dict(segments)}")
                
                # Churn analysis
                if 'Churn_Risk' in columns or 'churn_risk' in columns:
                    churn_col = 'Churn_Risk' if 'Churn_Risk' in columns else 'churn_risk'
                    churn_dist = df[churn_col].value_counts()
                    high_risk = churn_dist.get('High', 0)
                    insights.append(f"Churn Risk: {high_risk} high-risk customers out of {len(df)} total")
            
            # MARKETING ANALYSIS
            marketing_keywords = ['campaign', 'marketing', 'channel', 'conversion', 'roas', 'ctr', 'impressions']
            marketing_cols = [col for col in columns if any(keyword in col.lower() for keyword in marketing_keywords)]
            
            if marketing_cols:
                # Channel performance
                if 'Channel' in columns:
                    channels = df['Channel'].value_counts()
                    insights.append(f"Marketing Channels: {dict(channels)}")
                
                # ROI analysis
                if 'ROAS' in columns and 'ROAS' in numeric_cols:
                    avg_roas = df['ROAS'].mean()
                    best_roas = df['ROAS'].max()
                    insights.append(f"Marketing ROI: Average {avg_roas:.1f}x ROAS, Best performing {best_roas:.1f}x")
                
                # Conversion rates
                if 'Conversion_Rate_Percent' in columns:
                    avg_conv = df['Conversion_Rate_Percent'].mean()
                    insights.append(f"Average Conversion Rate: {avg_conv:.1f}%")
            
            # PRODUCT ANALYSIS
            product_keywords = ['product', 'item', 'inventory', 'stock', 'supplier']
            product_cols = [col for col in columns if any(keyword in col.lower() for keyword in product_keywords)]
            
            if product_cols:
                # Product performance
                if 'Product_Name' in columns and any('rating' in col.lower() for col in columns):
                    rating_col = [col for col in columns if 'rating' in col.lower()][0]
                    top_products = df.nlargest(3, rating_col)['Product_Name'].tolist()
                    insights.append(f"Top Rated Products: {', '.join(top_products)}")
                
                # Inventory levels
                if 'Stock_Level' in columns:
                    low_stock = df[df['Stock_Level'] < 50]['Product_Name'].count() if 'Product_Name' in columns else len(df[df['Stock_Level'] < 50])
                    insights.append(f"Inventory Alert: {low_stock} products with low stock (<50 units)")
            
            # EMPLOYEE ANALYSIS
            if 'employee' in file_name.lower() or any('employee' in col.lower() for col in columns):
                if 'Department' in columns:
                    dept_dist = df['Department'].value_counts()
                    insights.append(f"Employee Distribution: {dict(dept_dist)}")
                
                if 'Performance_Score' in columns:
                    avg_performance = df['Performance_Score'].mean()
                    high_performers = len(df[df['Performance_Score'] > 4])
                    insights.append(f"Performance: Average score {avg_performance:.1f}, {high_performers} high performers (>4.0)")
            
            # FINANCIAL ANALYSIS
            if 'financial' in file_name.lower():
                if 'Net_Profit' in columns and 'Revenue' in columns:
                    profit_margin = (df['Net_Profit'].sum() / df['Revenue'].sum()) * 100
                    insights.append(f"Profit Margin: {profit_margin:.1f}% overall")
                
                if 'Cash_Flow' in columns:
                    avg_cashflow = df['Cash_Flow'].mean()
                    positive_months = len(df[df['Cash_Flow'] > 0])
                    insights.append(f"Cash Flow: Average ${avg_cashflow:,.0f}, {positive_months}/{len(df)} positive months")
            
            # TIME-BASED ANALYSIS
            date_cols = [col for col in columns if any(date_word in col.lower() for date_word in ['date', 'time', 'month', 'year'])]
            if date_cols and len(df) > 1:
                insights.append(f"Time Period: {len(df)} data points spanning business operations")
            
            # Add query-specific insights
            query_lower = query.lower()
            if 'revenue' in query_lower or 'growth' in query_lower:
                revenue_insights = [insight for insight in insights if any(word in insight.lower() for word in ['revenue', 'sales', 'profit', 'growth'])]
                if revenue_insights:
                    insights = revenue_insights + [insight for insight in insights if insight not in revenue_insights]
            
            return {
                "overview": overview,
                "insights": insights[:10]  # Limit to top 10 most relevant insights
            }
            
        except Exception as e:
            logger.error(f"Error analyzing CSV data: {e}")
            return {
                "overview": f"Business data from '{file_name}' with {len(df)} records",
                "insights": ["Data contains business metrics for analysis"]
            }
