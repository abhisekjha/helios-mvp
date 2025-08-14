import json
from pymongo.database import Database
from app.core.config import settings
from app.crud import crud_planning, crud_goal
from app.models.goal import Goal
from app.models.planning import StrategicPlan
import openai

class PlanGenerator:
    def __init__(self, db: Database):
        self.db = db
        openai.api_key = settings.LLM_API_KEY

    def generate_plans_for_goal(self, goal: Goal, insight_ids: list[str]):
        insights = [self.db["market_insights"].find_one({"_id": i}) for i in insight_ids]
        insight_descriptions = [i["description"] for i in insights if i]

        prompt = f"""
        Given the goal: '{goal.objective_text}'
        And the following market insights:
        - {"\n- ".join(insight_descriptions)}

        Generate 3 distinct strategic plans to achieve this goal. 
        Return the plans in a structured JSON format like this:
        [
            {{
                "summary": "Plan A summary...",
                "pnl_forecast": {{ "2025": 10000, "2026": 15000 }},
                "risk_assessment": "Risk A..."
            }},
            ...
        ]
        """

        try:
            response = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=1024,
                n=1,
                stop=None,
                temperature=0.7,
            )
            plans_data = json.loads(response.choices.text.strip())
            
            for plan_data in plans_data:
                plan = StrategicPlan(
                    goal_id=str(goal.id),
                    summary=plan_data["summary"],
                    pnl_forecast=plan_data["pnl_forecast"],
                    risk_assessment=plan_data["risk_assessment"],
                    linked_insight_ids=insight_ids
                )
                crud_planning.create_strategic_plan(self.db, plan)
        except Exception as e:
            print(f"Error generating plans: {e}")