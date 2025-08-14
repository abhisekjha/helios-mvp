from typing import List, Optional, Dict, Any
from datetime import datetime
from pymongo.database import Database
from bson import ObjectId

from app.models.data_upload import DataUpload, Status


def create_data_upload(
    db: Database, 
    *, 
    goal_id: str, 
    uploader_id: str, 
    file_path: str, 
    file_name: str
) -> DataUpload:
    """Create a new data upload record."""
    data_upload_dict = {
        "goal_id": goal_id,
        "uploader_id": uploader_id,
        "file_path": file_path,
        "file_name": file_name,
        "upload_timestamp": datetime.utcnow(),
        "status": Status.PENDING,
        "insights": None
    }
    
    result = db.data_uploads.insert_one(data_upload_dict)
    return get_data_upload(db, upload_id=str(result.inserted_id))


def get_data_uploads_by_goal(db: Database, goal_id: str) -> List[DataUpload]:
    """Get all data uploads for a specific goal."""
    uploads_cursor = db.data_uploads.find({"goal_id": goal_id})
    uploads = []
    for upload_doc in uploads_cursor:
        upload_doc["_id"] = str(upload_doc["_id"])
        uploads.append(DataUpload(**upload_doc))
    return uploads


def get_data_upload(db: Database, upload_id: str) -> Optional[DataUpload]:
    """Get a single data upload by ID."""
    upload = db.data_uploads.find_one({"_id": ObjectId(upload_id)})
    if upload:
        upload["_id"] = str(upload["_id"])
        return DataUpload(**upload)
    return None


def get(db: Database, *, id: str) -> Optional[DataUpload]:
    """Alternative method name for consistency with other CRUD operations."""
    return get_data_upload(db, upload_id=id)


def update_data_upload_status(db: Database, upload_id: str, status: Status) -> Optional[DataUpload]:
    """Update the status of a data upload."""
    db.data_uploads.update_one(
        {"_id": ObjectId(upload_id)},
        {"$set": {"status": status.value, "updated_at": datetime.utcnow()}}
    )
    return get_data_upload(db, upload_id=upload_id)


def update(db: Database, *, db_obj: DataUpload, obj_in: Dict[str, Any]) -> Optional[DataUpload]:
    """Update a data upload with arbitrary fields."""
    update_data = obj_in.copy()
    update_data["updated_at"] = datetime.utcnow()
    
    db.data_uploads.update_one(
        {"_id": ObjectId(db_obj.id)},
        {"$set": update_data}
    )
    return get_data_upload(db, upload_id=db_obj.id)


def update_data_upload_insights(db: Database, upload_id: str, insights: str) -> Optional[DataUpload]:
    """Update the insights field of a data upload."""
    db.data_uploads.update_one(
        {"_id": ObjectId(upload_id)},
        {"$set": {"insights": insights, "updated_at": datetime.utcnow()}}
    )
    return get_data_upload(db, upload_id=upload_id)