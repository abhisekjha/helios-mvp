import json
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any
from openai import OpenAI
from pymongo.database import Database
from bson import ObjectId

from app.core.config import settings
from app.crud import crud_data_upload
from app.models.data_upload import DataUpload
from app.services.vector_embeddings import get_embedding_service


class InsightGenerator:
    """
    AI-powered insight generator that analyzes uploaded data and generates
    structured market insights using OpenAI's GPT models.
    """
    
    def __init__(self, db: Database):
        self.db = db
        self.client = OpenAI(api_key=settings.LLM_API_KEY)
    
    def generate_insights_from_upload(self, data_upload_id: str) -> List[str]:
        """
        Generate insights from a data upload and store them in the database.
        
        Args:
            data_upload_id: The ID of the data upload to analyze
            
        Returns:
            List[str]: List of insight IDs that were created
        """
        data_upload = crud_data_upload.get(self.db, id=data_upload_id)
        if not data_upload:
            raise ValueError(f"Data upload {data_upload_id} not found")
        
        # Read and analyze the CSV data
        try:
            df = pd.read_csv(data_upload.file_path)
        except Exception as e:
            raise ValueError(f"Failed to read CSV file: {str(e)}")
        
        # Generate data summary for the AI prompt
        data_summary = self._generate_data_summary(df)
        
        # Generate insights using AI
        insights_data = self._generate_ai_insights(data_summary, data_upload.goal_id)
        
        # **NEW: Create Knowledge Base from the CSV data**
        try:
            embedding_service = get_embedding_service(self.db)
            
            # Create text chunks from the CSV data
            chunks = embedding_service.chunk_csv_data(df, data_upload.goal_id)
            
            # Store chunks and embeddings in the knowledge base
            chunk_ids = embedding_service.store_knowledge_base(data_upload.goal_id, chunks)
            
            print(f"✅ Created knowledge base with {len(chunk_ids)} chunks for goal {data_upload.goal_id}")
            
        except Exception as e:
            print(f"⚠️  Warning: Failed to create knowledge base: {str(e)}")
            # Don't fail the entire process if knowledge base creation fails
        
        # Store insights in database
        insight_ids = []
        for insight in insights_data:
            insight_doc = {
                "description": insight["description"],
                "data_upload_id": data_upload_id,
                "timestamp": datetime.utcnow(),
                "insight_type": insight.get("type", "general"),
                "confidence_score": insight.get("confidence", 0.8),
                "supporting_data": insight.get("supporting_data", {}),
                "recommendations": insight.get("recommendations", [])
            }
            
            result = self.db.market_insights.insert_one(insight_doc)
            insight_ids.append(str(result.inserted_id))
        
        # Update data upload with insights summary
        insights_summary = "\n".join([insight["description"] for insight in insights_data])
        crud_data_upload.update(
            self.db, 
            db_obj=data_upload, 
            obj_in={"insights": insights_summary}
        )
        
        return insight_ids
    
    def _generate_data_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate a comprehensive summary of the uploaded data.
        
        Args:
            df: Pandas DataFrame containing the uploaded data
            
        Returns:
            Dict containing data summary statistics and insights
        """
        summary = {
            "total_records": len(df),
            "columns": list(df.columns),
            "date_range": {},
            "sales_metrics": {},
            "competitor_analysis": {},
            "trends": {}
        }
        
        # Date analysis
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date'])
            summary["date_range"] = {
                "start_date": df['Date'].min().isoformat(),
                "end_date": df['Date'].max().isoformat(),
                "duration_days": (df['Date'].max() - df['Date'].min()).days
            }
        
        # Sales analysis
        if 'Sales' in df.columns:
            summary["sales_metrics"] = {
                "total_sales": float(df['Sales'].sum()),
                "average_sales": float(df['Sales'].mean()),
                "max_sales": float(df['Sales'].max()),
                "min_sales": float(df['Sales'].min()),
                "sales_std": float(df['Sales'].std())
            }
        
        # Competitor price analysis
        if 'CompetitorPrice' in df.columns:
            summary["competitor_analysis"] = {
                "avg_competitor_price": float(df['CompetitorPrice'].mean()),
                "max_competitor_price": float(df['CompetitorPrice'].max()),
                "min_competitor_price": float(df['CompetitorPrice'].min())
            }
            
            # Price comparison if we have our own price data
            if 'OurPrice' in df.columns:
                summary["competitor_analysis"]["price_difference"] = float(
                    df['OurPrice'].mean() - df['CompetitorPrice'].mean()
                )
        
        # Trend analysis
        if 'Date' in df.columns and 'Sales' in df.columns:
            df_sorted = df.sort_values('Date')
            
            # Calculate weekly trends
            df_sorted['Week'] = df_sorted['Date'].dt.isocalendar().week
            weekly_sales = df_sorted.groupby('Week')['Sales'].sum()
            
            summary["trends"] = {
                "weekly_growth_rate": float(weekly_sales.pct_change().mean()),
                "trend_direction": "increasing" if weekly_sales.iloc[-1] > weekly_sales.iloc[0] else "decreasing",
                "seasonal_patterns": self._detect_seasonal_patterns(df_sorted)
            }
        
        return summary
    
    def _detect_seasonal_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect seasonal patterns in the data."""
        if len(df) < 7:  # Need at least a week of data
            return {"pattern": "insufficient_data"}
        
        df['DayOfWeek'] = df['Date'].dt.dayofweek
        daily_avg = df.groupby('DayOfWeek')['Sales'].mean()
        
        return {
            "pattern": "detected",
            "best_day": int(daily_avg.idxmax()),
            "worst_day": int(daily_avg.idxmin()),
            "weekly_variance": float(daily_avg.std())
        }
    
    def _generate_ai_insights(self, data_summary: Dict[str, Any], goal_id: str) -> List[Dict[str, Any]]:
        """
        Generate AI-powered insights based on data summary.
        
        Args:
            data_summary: Summary statistics of the data
            goal_id: ID of the goal this data relates to
            
        Returns:
            List of insight dictionaries
        """
        # Get goal context
        goal = self.db.goals.find_one({"_id": ObjectId(goal_id)})
        goal_context = goal.get("objective_text", "Unknown goal") if goal else "Unknown goal"
        
        prompt = f"""
You are a strategic business analyst. Analyze the following sales data and generate actionable market insights.

GOAL CONTEXT: {goal_context}

DATA SUMMARY:
- Total Records: {data_summary.get('total_records', 0)}
- Date Range: {data_summary.get('date_range', {})}
- Sales Metrics: {data_summary.get('sales_metrics', {})}
- Competitor Analysis: {data_summary.get('competitor_analysis', {})}
- Trends: {data_summary.get('trends', {})}

Generate EXACTLY 3 distinct market insights in the following JSON format:
{{
  "insights": [
    {{
      "description": "Clear, actionable insight description (1-2 sentences)",
      "type": "trend|competitive|seasonal|performance",
      "confidence": 0.0-1.0,
      "supporting_data": {{"key": "value"}},
      "recommendations": ["specific action 1", "specific action 2"]
    }}
  ]
}}

Requirements:
1. Each insight must be unique and actionable
2. Focus on business implications and opportunities
3. Include specific recommendations
4. Use data-driven reasoning
5. Confidence scores should reflect data quality
6. Types: trend, competitive, seasonal, performance

Return ONLY valid JSON, no other text.
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a strategic business analyst who provides data-driven insights in structured JSON format."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                insights_json = json.loads(response_text)
                return insights_json.get("insights", [])
            except json.JSONDecodeError:
                # Fallback: try to extract JSON from response
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = response_text[start_idx:end_idx]
                    insights_json = json.loads(json_str)
                    return insights_json.get("insights", [])
                else:
                    raise ValueError("Could not parse AI response as JSON")
                    
        except Exception as e:
            # Fallback insights if AI fails
            print(f"AI insight generation failed: {str(e)}")
            return self._generate_fallback_insights(data_summary)
    
    def _generate_fallback_insights(self, data_summary: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate basic insights if AI fails."""
        fallback_insights = []
        
        # Sales performance insight
        sales_metrics = data_summary.get('sales_metrics', {})
        if sales_metrics:
            total_sales = sales_metrics.get('total_sales', 0)
            avg_sales = sales_metrics.get('average_sales', 0)
            
            fallback_insights.append({
                "description": f"Total sales of ${total_sales:,.2f} with average daily sales of ${avg_sales:,.2f}",
                "type": "performance",
                "confidence": 0.9,
                "supporting_data": sales_metrics,
                "recommendations": ["Monitor daily sales trends", "Set performance benchmarks"]
            })
        
        # Trend insight
        trends = data_summary.get('trends', {})
        if trends.get('trend_direction'):
            direction = trends['trend_direction']
            fallback_insights.append({
                "description": f"Sales trend is {direction} over the analyzed period",
                "type": "trend",
                "confidence": 0.8,
                "supporting_data": trends,
                "recommendations": [
                    "Investigate factors driving trend" if direction == "increasing" else "Develop improvement strategies"
                ]
            })
        
        # Competitive insight
        competitor_analysis = data_summary.get('competitor_analysis', {})
        if competitor_analysis:
            fallback_insights.append({
                "description": "Competitor pricing analysis reveals market positioning opportunities",
                "type": "competitive",
                "confidence": 0.7,
                "supporting_data": competitor_analysis,
                "recommendations": ["Review pricing strategy", "Monitor competitor movements"]
            })
        
        return fallback_insights[:3]  # Return max 3 insights


def generate_insight(db: Database, *, data_upload_id: str) -> DataUpload:
    """
    Legacy function for backward compatibility.
    Generate insights for a data upload.
    """
    insight_generator = InsightGenerator(db)
    insight_generator.generate_insights_from_upload(data_upload_id)
    
    # Return updated data upload
    return crud_data_upload.get(db, id=data_upload_id)