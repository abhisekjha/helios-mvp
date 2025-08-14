from typing import List
from pymongo.database import Database
from bson import ObjectId
from app.models.data_upload import DataUpload, Status

def create_data_upload(db: Database, *, data_upload: DataUpload) -> DataUpload:
    inserted_result = db.data_uploads.insert_one(data_upload.model_dump())
    return get_data_upload(db, upload_id=inserted_result.inserted_id)

def get_data_uploads_by_goal(db: Database, goal_id: str) -> List[DataUpload]:
    uploads = db.data_uploads.find({"goal_id": goal_id})
    return [DataUpload(**upload) for upload in uploads]

def get_data_upload(db: Database, upload_id: str) -> DataUpload:
    upload = db.data_uploads.find_one({"_id": ObjectId(upload_id)})
    if upload:
        return DataUpload(**upload)
    return None

def update_data_upload_status(db: Database, upload_id: str, status: Status) -> DataUpload:
    db.data_uploads.update_one(
        {"_id": ObjectId(upload_id)},
        {"$set": {"status": status.value}}
    )
    return get_data_upload(db, upload_id=upload_id)

def update_data_upload_insights(db: Database, upload_id: str, insights: list[str]) -> DataUpload:
    db.data_uploads.update_one(
        {"_id": ObjectId(upload_id)},
        {"$set": {"insights": insights}}
    )
    return get_data_upload(db, upload_id=upload_id)