from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.api.deps import get_current_active_user, get_db
from app.crud import crud_goal, crud_user
from app.models.goal import GoalStatus
from app.models.user import User, Role
from app.schemas.goal import Goal, GoalCreate, GoalUpdate
from app.api.v1.endpoints import data_uploads

router = APIRouter()

router.include_router(
    data_uploads.router,
    prefix="/{goal_id}/uploads",
    tags=["data_uploads"],
)


@router.post("/", response_model=Goal, status_code=status.HTTP_201_CREATED)
def create_goal(
    *,
    db: Database = Depends(get_db),
    goal_in: GoalCreate,
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new goal.
    """
    owner_id = current_user.id
    if current_user.role in [Role.DIRECTOR, Role.MANAGER] and goal_in.owner_id:
        owner_id = goal_in.owner_id
    goal = crud_goal.create_goal(db=db, obj_in=goal_in, owner_id=owner_id)
    return goal


@router.get("/", response_model=List[Goal])
def read_goals(
    db: Database = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve goals for the current user.
    """
    if current_user.role == Role.DIRECTOR:
        goals = crud_goal.get_multi(db=db, skip=skip, limit=limit)
    elif current_user.role == Role.MANAGER:
        goals = crud_goal.get_multi(db=db, skip=skip, limit=limit)
    else:
        goals = crud_goal.get_multi_by_owner(
            db=db, owner_id=current_user.id, skip=skip, limit=limit
        )
    return goals


@router.get("/{goal_id}", response_model=Goal)
def read_goal(
    *,
    db: Database = Depends(get_db),
    goal_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Get goal by ID.
    """
    goal = crud_goal.get(db=db, id=goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    if goal.owner_id != current_user.id and current_user.role not in [Role.DIRECTOR, Role.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return goal


@router.put("/{goal_id}", response_model=Goal)
def update_goal(
    *,
    db: Database = Depends(get_db),
    goal_id: str,
    goal_in: GoalUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """
    Update a goal.
    """
    if current_user.role not in [Role.DIRECTOR, Role.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    goal = crud_goal.get(db=db, id=goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    if goal.status != GoalStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit a goal that is not in Draft status",
        )
    goal = crud_goal.update(db=db, db_obj=goal, obj_in=goal_in)
    return goal


@router.delete("/{goal_id}", response_model=Goal)
def delete_goal(
    *,
    db: Database = Depends(get_db),
    goal_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a goal.
    """
    if current_user.role not in [Role.DIRECTOR, Role.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    goal = crud_goal.get(db=db, id=goal_id)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    goal = crud_goal.remove(db=db, id=goal_id)
    return goal