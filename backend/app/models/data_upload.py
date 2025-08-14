from datetime import datetime
from enum import Enum
from typing import Optional, Annotated

from bson import ObjectId
from pydantic import BaseModel, Field, BeforeValidator


class Status(str, Enum):
    PENDING = "Pending"
    VALIDATING = "Validating"
    FAILED = "Failed"
    COMPLETE = "Complete"


PyObjectId = Annotated[
    str,
    BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v),
]


class DataUpload(BaseModel):
    id: Optional[PyObjectId] = Field(None, alias="_id")
    goal_id: str
    uploader_id: str
    file_name: str
    file_path: str
    upload_timestamp: datetime
    status: Status
    insights: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True
