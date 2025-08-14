from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator
from bson import ObjectId


class GoalStatus(str, Enum):
    DRAFT = "Draft"
    PROCESSING = "Processing"
    AWAITING_REVIEW = "AWAITING_REVIEW"
    COMPLETE = "Complete"
    FAILED = "Failed"


class Goal(BaseModel):
    id: str = Field(alias="_id")
    objective_text: str
    budget: float
    start_date: datetime
    end_date: datetime
    status: GoalStatus
    owner_id: str

    @field_validator("id", mode="before")
    def transform_id(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v