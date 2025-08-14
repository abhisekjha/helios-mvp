import logging
from typing import List
from ..models.planning import MarketInsight, StrategicPlan
from pymongo.database import Database
from bson import ObjectId

logger = logging.getLogger(__name__)


def create_market_insight(db: Database, insight: MarketInsight) -> str:
    """Creates a new market insight in the database."""
    collection = db["market_insights"]
    result = collection.insert_one(insight.dict())
    return str(result.inserted_id)


def create_strategic_plan(db: Database, plan: StrategicPlan) -> str:
    """Creates a new strategic plan in the database."""
    collection = db["strategic_plans"]
    result = collection.insert_one(plan.dict())
    return str(result.inserted_id)


def get_plans_by_goal_id(db: Database, goal_id: str) -> List[StrategicPlan]:
    """Fetches all strategic plans for a given goal_id."""
    logger.info(f"Fetching plans for goal_id: {goal_id}")
    collection = db["strategic_plans"]
    plans_cursor = collection.find({"goal_id": goal_id})
    plans = [StrategicPlan(**plan) for plan in plans_cursor]
    logger.info(f"Found {len(plans)} plans for goal_id: {goal_id}")
    return plans

def get_plan(db: Database, plan_id: str) -> StrategicPlan | None:
    """Fetches a single strategic plan by its ID."""
    collection = db["strategic_plans"]
    plan = collection.find_one({"_id": ObjectId(plan_id)})
    if plan:
        return StrategicPlan(**plan)
    return None


def update_plan_status(db: Database, plan_id: str, status: str):
    """Updates the status of a single strategic plan."""
    collection = db["strategic_plans"]
    collection.update_one({"_id": ObjectId(plan_id)}, {"$set": {"status": status}})


def update_plans_status_by_goal_id(db: Database, goal_id: str, status: str, exclude_plan_id: str = None):
    """Updates the status of all strategic plans for a given goal_id, with an optional exclusion."""
    collection = db["strategic_plans"]
    query = {"goal_id": goal_id}
    if exclude_plan_id:
        query["_id"] = {"$ne": ObjectId(exclude_plan_id)}
    collection.update_many(query, {"$set": {"status": status}})