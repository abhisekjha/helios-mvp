from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.goal import GoalStatus


class GoalBase(BaseModel):
    objective_text: str
    budget: float
    start_date: datetime
    end_date: datetime


class GoalCreate(GoalBase):
    owner_id: Optional[str] = None


class GoalUpdate(BaseModel):
    objective_text: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class GoalInDBBase(GoalBase):
    id: str
    status: GoalStatus
    owner_id: str

    class Config:
        from_attributes = True


class Goal(GoalInDBBase):
    pass