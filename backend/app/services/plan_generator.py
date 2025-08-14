import json
from datetime import datetime
from typing import List, Dict, Any
from openai import OpenAI
from pymongo.database import Database
from bson import ObjectId

from app.core.config import settings
from app.crud import crud_planning, crud_goal
from app.models.goal import Goal
from app.models.planning import StrategicPlan, PlanStatus


class PlanGenerator:
    """
    AI-powered strategic plan generator that creates multiple distinct 
    strategic plans based on goal objectives and market insights.
    """
    
    def __init__(self, db: Database):
        self.db = db
        self.client = OpenAI(api_key=settings.LLM_API_KEY)
    
    def generate_plans_for_goal(self, goal: Goal, insight_ids: List[str]) -> List[str]:
        """
        Generate 3 distinct strategic plans for a goal based on market insights.
        
        Args:
            goal: The goal object to generate plans for
            insight_ids: List of insight IDs to base plans on
            
        Returns:
            List[str]: List of created plan IDs
        """
        # Fetch insights from database
        insights = []
        for insight_id in insight_ids:
            insight = self.db.market_insights.find_one({"_id": ObjectId(insight_id)})
            if insight:
                insights.append(insight)
        
        if not insights:
            raise ValueError("No valid insights found for plan generation")
        
        # Generate plans using AI
        plans_data = self._generate_ai_plans(goal, insights)
        
        # Store plans in database
        plan_ids = []
        for i, plan_data in enumerate(plans_data):
            plan = StrategicPlan(
                goal_id=str(goal.id),
                summary=plan_data["summary"],
                pnl_forecast=plan_data["pnl_forecast"],
                risk_assessment=plan_data["risk_assessment"],
                status=PlanStatus.PENDING,
                linked_insight_ids=insight_ids
            )
            
            # Add plan to database using CRUD
            plan_dict = plan.model_dump()
            plan_dict["created_at"] = datetime.utcnow()
            plan_dict["plan_name"] = plan_data.get("plan_name", f"Plan {chr(65+i)}")  # Plan A, B, C
            
            result = self.db.strategic_plans.insert_one(plan_dict)
            plan_ids.append(str(result.inserted_id))
        
        return plan_ids
    
    def _generate_ai_plans(self, goal: Goal, insights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate strategic plans using OpenAI's GPT model.
        
        Args:
            goal: Goal object containing objective and constraints
            insights: List of market insights
            
        Returns:
            List of plan dictionaries
        """
        # Prepare insights summary for the prompt
        insights_summary = []
        for insight in insights:
            insights_summary.append({
                "description": insight.get("description", ""),
                "type": insight.get("insight_type", "general"),
                "confidence": insight.get("confidence_score", 0.8),
                "recommendations": insight.get("recommendations", [])
            })
        
        # Calculate time horizon for forecasting
        start_date = goal.start_date
        end_date = goal.end_date
        duration_months = ((end_date - start_date).days) // 30
        
        prompt = f"""
You are a strategic business consultant. Generate 3 DISTINCT strategic plans to achieve the following business goal.

GOAL DETAILS:
- Objective: {goal.objective_text}
- Budget: ${goal.budget:,.2f}
- Duration: {duration_months} months ({start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')})

MARKET INSIGHTS:
{json.dumps(insights_summary, indent=2)}

Generate EXACTLY 3 different strategic approaches. Each plan should be unique in strategy, risk profile, and execution approach.

Return response in this EXACT JSON format:
{{
  "plans": [
    {{
      "plan_name": "Aggressive Growth Plan",
      "summary": "Detailed 2-3 sentence summary of the strategic approach and key tactics",
      "pnl_forecast": {{
        "q1_revenue": 0,
        "q2_revenue": 0,
        "q3_revenue": 0,
        "q4_revenue": 0,
        "total_investment": 0,
        "projected_roi": 0,
        "break_even_month": 0
      }},
      "risk_assessment": "Comprehensive risk analysis including market, financial, and operational risks. Include mitigation strategies."
    }},
    {{
      "plan_name": "Conservative Approach",
      "summary": "Different strategic approach focusing on lower risk",
      "pnl_forecast": {{
        "q1_revenue": 0,
        "q2_revenue": 0,
        "q3_revenue": 0,
        "q4_revenue": 0,
        "total_investment": 0,
        "projected_roi": 0,
        "break_even_month": 0
      }},
      "risk_assessment": "Risk analysis for conservative approach"
    }},
    {{
      "plan_name": "Innovation Strategy",
      "summary": "Third unique approach focusing on innovation/differentiation",
      "pnl_forecast": {{
        "q1_revenue": 0,
        "q2_revenue": 0,
        "q3_revenue": 0,
        "q4_revenue": 0,
        "total_investment": 0,
        "projected_roi": 0,
        "break_even_month": 0
      }},
      "risk_assessment": "Risk analysis for innovation-focused strategy"
    }}
  ]
}}

Requirements:
1. Each plan must have a DIFFERENT strategic approach
2. Revenue forecasts should be realistic and progressive
3. Total investment should not exceed the budget: ${goal.budget:,.2f}
4. ROI should be calculated as (total_revenue - total_investment) / total_investment
5. Break-even month should be when cumulative revenue > cumulative investment
6. Risk assessments should be specific and actionable
7. Base recommendations on the provided market insights

Return ONLY valid JSON, no other text.
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",  # Use GPT-4 for better strategic planning
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a strategic business consultant who creates detailed, actionable strategic plans in structured JSON format. Always provide realistic financial projections and thorough risk assessments."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,  # Slightly creative but focused
                max_tokens=2500
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                plans_json = json.loads(response_text)
                plans = plans_json.get("plans", [])
                
                # Validate that we got 3 plans
                if len(plans) != 3:
                    raise ValueError(f"Expected 3 plans, got {len(plans)}")
                
                return plans
                
            except json.JSONDecodeError:
                # Try to extract JSON from response
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = response_text[start_idx:end_idx]
                    plans_json = json.loads(json_str)
                    return plans_json.get("plans", [])
                else:
                    raise ValueError("Could not parse AI response as JSON")
                    
        except Exception as e:
            print(f"AI plan generation failed: {str(e)}")
            # Generate fallback plans
            return self._generate_fallback_plans(goal, insights)
    
    def _generate_fallback_plans(self, goal: Goal, insights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate basic fallback plans if AI generation fails.
        
        Args:
            goal: Goal object
            insights: Market insights
            
        Returns:
            List of basic plan dictionaries
        """
        budget = goal.budget
        
        fallback_plans = [
            {
                "plan_name": "Conservative Growth Plan",
                "summary": f"A conservative approach focusing on steady growth with minimal risk. Allocate {budget*0.7:.0f} to proven strategies and {budget*0.3:.0f} to testing new approaches.",
                "pnl_forecast": {
                    "q1_revenue": budget * 0.2,
                    "q2_revenue": budget * 0.3,
                    "q3_revenue": budget * 0.4,
                    "q4_revenue": budget * 0.5,
                    "total_investment": budget * 0.8,
                    "projected_roi": 0.75,
                    "break_even_month": 6
                },
                "risk_assessment": "Low risk approach with proven strategies. Main risks include market saturation and slow growth. Mitigation: Regular market monitoring and gradual strategy adjustments."
            },
            {
                "plan_name": "Aggressive Market Expansion",
                "summary": f"High-growth strategy investing heavily in market expansion and customer acquisition. Front-load investment for maximum market impact.",
                "pnl_forecast": {
                    "q1_revenue": budget * 0.1,
                    "q2_revenue": budget * 0.4,
                    "q3_revenue": budget * 0.7,
                    "q4_revenue": budget * 1.0,
                    "total_investment": budget * 0.95,
                    "projected_roi": 1.2,
                    "break_even_month": 8
                },
                "risk_assessment": "High risk, high reward strategy. Risks include cash flow strain and market competition. Mitigation: Phased rollout and performance monitoring."
            },
            {
                "plan_name": "Balanced Innovation Strategy",
                "summary": f"Balanced approach combining proven methods with innovative tactics. Equal focus on current market and future opportunities.",
                "pnl_forecast": {
                    "q1_revenue": budget * 0.15,
                    "q2_revenue": budget * 0.35,
                    "q3_revenue": budget * 0.55,
                    "q4_revenue": budget * 0.75,
                    "total_investment": budget * 0.85,
                    "projected_roi": 0.95,
                    "break_even_month": 7
                },
                "risk_assessment": "Medium risk strategy balancing growth and stability. Risks include execution complexity and resource allocation. Mitigation: Clear milestones and regular strategy reviews."
            }
        ]
        
        return fallback_plans