from datetime import datetime
from enum import Enum
from typing import List, Dict, Optional, Annotated
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId


PyObjectId = Annotated[
    str,
    BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v),
]


class MarketInsight(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    description: str
    data_upload_id: str
    timestamp: datetime
    insight_type: str = "general"
    confidence_score: float = 0.8
    supporting_data: Dict = {}
    recommendations: List[str] = []

    class Config:
        from_attributes = True
        populate_by_name = True


class PlanStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    DISMISSED = "Dismissed"


class StrategicPlan(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    goal_id: str
    plan_name: str = "Strategic Plan"
    summary: str
    pnl_forecast: Dict
    risk_assessment: str
    status: PlanStatus = PlanStatus.PENDING
    linked_insight_ids: List[str] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True