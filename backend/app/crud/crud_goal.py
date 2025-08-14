from typing import List, Optional, Union

from pymongo.database import Database
from bson import ObjectId

from app.models.goal import Goal, GoalStatus
from app.schemas.goal import GoalCreate, GoalUpdate


def create_goal(db: Database, *, obj_in: GoalCreate, owner_id: str) -> Goal:
    goal_data = obj_in.model_dump()
    goal_data["owner_id"] = owner_id
    goal_data["status"] = GoalStatus.DRAFT
    inserted_result = db.goals.insert_one(goal_data)
    return get(db, id=inserted_result.inserted_id)


def get_multi_by_owner(
    db: Database, *, owner_id: str, skip: int = 0, limit: int = 100
) -> List[Goal]:
    goals = (
        db.goals.find({"owner_id": owner_id})
        .skip(skip)
        .limit(limit)
    )
    return [Goal(**goal) for goal in goals]


def get_multi(db: Database, *, skip: int = 0, limit: int = 100) -> List[Goal]:
    """
    Retrieve all goals.
    """
    goals = db.goals.find().skip(skip).limit(limit)
    return [Goal(**goal) for goal in goals]


def get(db: Database, *, id: Union[str, ObjectId]) -> Optional[Goal]:
    if isinstance(id, str):
        id = ObjectId(id)
    goal = db.goals.find_one({"_id": id})
    if goal:
        return Goal(**goal)
    return None


def update(db: Database, *, db_obj: Goal, obj_in: GoalUpdate) -> Goal:
    update_data = obj_in.model_dump(exclude_unset=True)
    db.goals.update_one({"_id": ObjectId(db_obj.id)}, {"$set": update_data})
    return get(db, id=db_obj.id)


def remove(db: Database, *, id: str) -> Goal:
    goal = get(db, id=id)
    db.goals.delete_one({"_id": ObjectId(id)})
    return goal


def update_goal_status(db: Database, *, goal_id: str, status: GoalStatus) -> None:
    """
    Update the status of a goal.
    """
    db.goals.update_one({"_id": ObjectId(goal_id)}, {"$set": {"status": status.value}})


def get_multi_for_user_and_subordinates(
    db: Database, *, owner_ids: List[str], skip: int = 0, limit: int = 100
) -> List[Goal]:
    goals = (
        db.goals.find({"owner_id": {"$in": owner_ids}})
        .skip(skip)
        .limit(limit)
    )
    return [Goal(**goal) for goal in goals]