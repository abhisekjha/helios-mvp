import logging
from typing import List, Optional
from datetime import datetime
from pymongo.database import Database
from bson import ObjectId

from app.models.planning import MarketInsight, StrategicPlan, PlanStatus

logger = logging.getLogger(__name__)


def create_market_insight(db: Database, insight: MarketInsight) -> str:
    """Creates a new market insight in the database."""
    collection = db["market_insights"]
    insight_dict = insight.model_dump(exclude={"id"})
    if "timestamp" not in insight_dict:
        insight_dict["timestamp"] = datetime.utcnow()
    result = collection.insert_one(insight_dict)
    return str(result.inserted_id)


def create_strategic_plan(db: Database, plan: StrategicPlan) -> str:
    """Creates a new strategic plan in the database."""
    collection = db["strategic_plans"]
    plan_dict = plan.model_dump(exclude={"id"})
    if "created_at" not in plan_dict:
        plan_dict["created_at"] = datetime.utcnow()
    result = collection.insert_one(plan_dict)
    return str(result.inserted_id)


def get_plans_by_goal_id(db: Database, goal_id: str) -> List[StrategicPlan]:
    """Fetches all strategic plans for a given goal_id."""
    logger.info(f"Fetching plans for goal_id: {goal_id}")
    collection = db["strategic_plans"]
    plans_cursor = collection.find({"goal_id": goal_id})
    plans = []
    for plan_doc in plans_cursor:
        plan_doc["_id"] = str(plan_doc["_id"])
        plans.append(StrategicPlan(**plan_doc))
    logger.info(f"Found {len(plans)} plans for goal_id: {goal_id}")
    return plans


def get_plan(db: Database, plan_id: str) -> Optional[StrategicPlan]:
    """Fetches a single strategic plan by its ID."""
    collection = db["strategic_plans"]
    plan = collection.find_one({"_id": ObjectId(plan_id)})
    if plan:
        plan["_id"] = str(plan["_id"])
        return StrategicPlan(**plan)
    return None


def update_plan_status(db: Database, plan_id: str, status: str):
    """Updates the status of a single strategic plan."""
    collection = db["strategic_plans"]
    collection.update_one(
        {"_id": ObjectId(plan_id)}, 
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )


def update_plans_status_by_goal_id(db: Database, goal_id: str, status: str, exclude_plan_id: str = None):
    """Updates the status of all strategic plans for a given goal_id, with an optional exclusion."""
    collection = db["strategic_plans"]
    query = {"goal_id": goal_id}
    if exclude_plan_id:
        query["_id"] = {"$ne": ObjectId(exclude_plan_id)}
    collection.update_many(
        query, 
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )


def get_insights_by_ids(db: Database, insight_ids: List[str]) -> List[MarketInsight]:
    """Fetches market insights by their IDs."""
    collection = db["market_insights"]
    object_ids = [ObjectId(id_str) for id_str in insight_ids]
    insights_cursor = collection.find({"_id": {"$in": object_ids}})
    insights = []
    for insight_doc in insights_cursor:
        insight_doc["_id"] = str(insight_doc["_id"])
        insights.append(MarketInsight(**insight_doc))
    return insights


def get_insights_by_data_upload_id(db: Database, data_upload_id: str) -> List[MarketInsight]:
    """Fetches all market insights for a given data upload."""
    collection = db["market_insights"]
    insights_cursor = collection.find({"data_upload_id": data_upload_id})
    insights = []
    for insight_doc in insights_cursor:
        insight_doc["_id"] = str(insight_doc["_id"])
        insights.append(MarketInsight(**insight_doc))
    return insights