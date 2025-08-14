from datetime import datetime
from typing import Optional, Annotated

from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, Field

from app.models.data_upload import Status

PyObjectId = Annotated[
    str,
    BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v),
]


class DataUploadBase(BaseModel):
    goal_id: str
    file_name: str


class DataUploadCreate(DataUploadBase):
    pass


class DataUploadUpdate(BaseModel):
    status: Optional[Status] = None
    insights: Optional[str] = None


class DataUploadInDBBase(DataUploadBase):
    id: PyObjectId = Field(alias="_id")
    uploader_id: str
    file_path: str
    upload_timestamp: datetime
    status: Status
    insights: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class DataUpload(DataUploadInDBBase):
    pass