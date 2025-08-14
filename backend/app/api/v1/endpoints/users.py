from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User, Role
from app.schemas.user import User, UserCreate, UserUpdate
from app.crud import crud_user
from app.api import deps

router = APIRouter()


@router.get("/me", response_model=User)
def read_users_me(current_user: User = Depends(deps.get_current_active_user)):
    return current_user


@router.get("/", response_model=List[User])
def read_users(
    db: deps.Database = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles(["director", "manager"])),
):
    """
    Retrieve all users.
    """
    users = crud_user.get_all_users(db)
    return users


@router.post("/", response_model=User)
def create_user(
    *,
    db: deps.Database = Depends(deps.get_db),
    user_in: UserCreate,
):
    """
    Create new user.
    """
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = crud_user.create_user(db, user_in=user_in)
    return user


@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    db: deps.Database = Depends(deps.get_db),
    user_id: str,
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update a user.
    """
    if current_user.role != Role.DIRECTOR:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions",
        )
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    user = crud_user.update_user(db, user=user, user_in=user_in)
    return user