from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.api.deps import get_db, get_current_active_user, require_role
from app.models.user import User
from app.models.planning import StrategicPlan
from app.models.goal import GoalStatus
from app.crud import crud_planning, crud_goal
from pymongo.database import Database

router = APIRouter()

@router.get("/goals/{goal_id}/plans", response_model=List[StrategicPlan])
def get_plans_for_goal(
    goal_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Fetch all strategic plans for a given goal.
    """
    plans = crud_planning.get_plans_by_goal_id(db, goal_id=goal_id)
    return plans

@router.post("/plans/{plan_id}/approve", response_model=dict)
def approve_plan(
    plan_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(require_role("director")),
):
    """
    Approve a strategic plan.
    """
    plan = crud_planning.get_plan(db, plan_id=plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Update the approved plan's status
    crud_planning.update_plan_status(db, plan_id=plan_id, status="Approved")

    # Update other plans for the same goal to "Dismissed"
    crud_planning.update_plans_status_by_goal_id(
        db, goal_id=plan.goal_id, status="Dismissed", exclude_plan_id=plan_id
    )

    # Update the parent goal's status to "Complete"
    crud_goal.update_goal_status(db, goal_id=plan.goal_id, status=GoalStatus.COMPLETE)

    return {"message": "Plan approved successfully"}