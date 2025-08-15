import os
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Path, status
from pymongo.database import Database
from bson import ObjectId

from app.api import deps
from app.core.celery_worker import validate_csv_file
from app.crud import crud_data_upload
from app.models.data_upload import DataUpload, Status
from app.models.user import User
from app.services import insight_generator

router = APIRouter()

UPLOADS_DIR = "backend/uploads"

os.makedirs(UPLOADS_DIR, exist_ok=True)


@router.post(
    "/",
    dependencies=[Depends(deps.require_roles(["manager", "director"]))],
)
async def upload_data(
    goal_id: str = Path(..., description="The ID of the goal to upload data for"),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user),
    db: Database = Depends(deps.get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    data_upload = crud_data_upload.create_data_upload(
        db=db,
        goal_id=goal_id,
        uploader_id=str(current_user.id),
        file_path=file_path,
        file_name=file.filename,
    )
    created_upload = data_upload

    validate_csv_file.delay(str(created_upload.id))

    return created_upload


@router.get("/", response_model=List[DataUpload])
def list_uploads_for_goal(
    db: Database = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    goal_id: str = Path(..., description="The ID of the goal to list uploads for"),
):
    return crud_data_upload.get_data_uploads_by_goal(db, goal_id=goal_id)


@router.post("/{data_upload_id}/generate_insight", response_model=DataUpload)
def generate_insight_for_upload(
    data_upload_id: str,
    db: Database = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Generate insights for a specific data upload.
    """
    return insight_generator.generate_insight(db, data_upload_id=data_upload_id)


@router.delete("/{data_upload_id}")
def delete_data_upload(
    goal_id: str = Path(..., description="The ID of the goal"),
    data_upload_id: str = Path(..., description="The ID of the data upload to delete"),
    db: Database = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Delete a data upload and its associated files.
    Only directors and managers can delete uploads.
    """
    # Check permissions
    if current_user.role not in ["director", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete uploads"
        )
    
    # Get the data upload
    data_upload = crud_data_upload.get_data_upload(db, upload_id=data_upload_id)
    if not data_upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data upload not found"
        )
    
    try:
        # Delete the physical file
        if os.path.exists(data_upload.file_path):
            os.remove(data_upload.file_path)
        
        # Delete related insights
        db.market_insights.delete_many({"data_upload_id": data_upload_id})
        
        # Delete knowledge base entries for this goal (optional - you might want to keep them)
        # from app.services.vector_embeddings import get_embedding_service
        # embedding_service = get_embedding_service(db)
        # embedding_service.delete_goal_knowledge_base(data_upload.goal_id)
        
        # Delete the data upload record
        db.data_uploads.delete_one({"_id": ObjectId(data_upload_id)})
        
        return {"message": "Data upload deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting upload: {str(e)}"
        )