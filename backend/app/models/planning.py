from datetime import datetime
from enum import Enum
from pydantic import BaseModel
from typing import List, Dict

class MarketInsight(BaseModel):
    description: str
    data_upload_id: str
    timestamp: datetime

class PlanStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    DISMISSED = "Dismissed"

class StrategicPlan(BaseModel):
    goal_id: str
    summary: str
    pnl_forecast: Dict
    risk_assessment: str
    status: PlanStatus = PlanStatus.PENDING
    linked_insight_ids: List[str] = []