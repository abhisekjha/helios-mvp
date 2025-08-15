import csv
from celery import Celery
from pymongo import MongoClient

from app.core.config import settings
from app.crud import crud_data_upload, crud_goal
from app.models.data_upload import Status
from app.models.goal import GoalStatus
from app.schemas.goal import GoalUpdate

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)


@celery_app.task
def validate_csv_file(upload_id: str):
    """Validate uploaded CSV file and trigger insight generation if valid."""
    client = MongoClient(settings.DATABASE_URL)
    db = client[settings.MONGODB_DB_NAME]
    data_upload = None
    
    try:
        data_upload = crud_data_upload.get_data_upload(db, upload_id=upload_id)
        if not data_upload:
            return

        crud_data_upload.update_data_upload_status(db, upload_id=upload_id, status=Status.VALIDATING)

        required_headers = {'Date', 'Sales', 'CompetitorPrice'}
        
        with open(data_upload.file_path, 'r') as f:
            reader = csv.reader(f)
            headers = next(reader)
            
            if required_headers.issubset(set(headers)):
                crud_data_upload.update_data_upload_status(db, upload_id=upload_id, status=Status.COMPLETE)
                
                # Update goal status to processing
                goal = crud_goal.get(db, id=data_upload.goal_id)
                if goal:
                    crud_goal.update(db, db_obj=goal, obj_in=GoalUpdate(status=GoalStatus.PROCESSING))
                    
                # Trigger insight generation
                generate_insights_from_upload.delay(upload_id)
            else:
                crud_data_upload.update_data_upload_status(db, upload_id=upload_id, status=Status.FAILED)
                
    except Exception as e:
        if data_upload:
            crud_data_upload.update_data_upload_status(db, upload_id=upload_id, status=Status.FAILED)
        notify_task_failure.delay('validate_csv_file', str(e))
    finally:
        client.close()


@celery_app.task
def generate_insights_from_upload(upload_id: str):
    """Generate AI insights from uploaded data."""
    client = MongoClient(settings.DATABASE_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    try:
        from app.services.insight_generator import InsightGenerator
        
        insight_generator = InsightGenerator(db)
        insight_ids = insight_generator.generate_insights_from_upload(upload_id)
        
        # Get the data upload to find the associated goal
        data_upload = crud_data_upload.get_data_upload(db, upload_id=upload_id)
        if data_upload and insight_ids:
            # Trigger plan generation
            generate_plans_for_goal.delay(data_upload.goal_id, insight_ids)
            
    except Exception as e:
        notify_task_failure.delay('generate_insights_from_upload', str(e))
    finally:
        client.close()


@celery_app.task
def generate_plans_for_goal(goal_id: str, insight_ids: list = None):
    """Generate strategic plans for a goal based on insights."""
    client = MongoClient(settings.DATABASE_URL)
    db = client[settings.MONGODB_DB_NAME]
    goal = None
    
    try:
        from app.services.plan_generator import PlanGenerator
        
        goal = crud_goal.get(db, id=goal_id)
        if not goal:
            return

        # If no insight_ids provided, get them from data uploads
        if not insight_ids:
            data_uploads = crud_data_upload.get_data_uploads_by_goal(db, goal_id=goal_id)
            if not data_uploads:
                return
            
            # Get insights from all data uploads for this goal
            insight_ids = []
            for upload in data_uploads:
                upload_insights = db.market_insights.find({"data_upload_id": str(upload.id)})
                insight_ids.extend([str(insight["_id"]) for insight in upload_insights])
        
        if insight_ids:
            plan_generator = PlanGenerator(db)
            plan_ids = plan_generator.generate_plans_for_goal(goal, insight_ids)
            
            if plan_ids:
                # Update goal status to awaiting review
                crud_goal.update(
                    db, 
                    db_obj=goal, 
                    obj_in=GoalUpdate(status=GoalStatus.AWAITING_REVIEW)
                )
            else:
                # If no plans were generated, mark as failed
                crud_goal.update(
                    db, 
                    db_obj=goal, 
                    obj_in=GoalUpdate(status=GoalStatus.FAILED)
                )
        
    except Exception as e:
        if goal:
            crud_goal.update(
                db, 
                db_obj=goal, 
                obj_in=GoalUpdate(status=GoalStatus.FAILED)
            )
        notify_task_failure.delay('generate_plans_for_goal', str(e))
    finally:
        client.close()


@celery_app.task
def notify_task_failure(task_name: str, error_message: str):
    """Handle task failures with logging and optional notifications."""
    # Log the failure
    print(f"Task {task_name} failed with error: {error_message}")
    
    # In production, you could:
    # - Send email notifications
    # - Post to Slack/Teams
    # - Store in error tracking system
    # - Update database with failure details
    
    # For now, just log to ensure visibility
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Celery task failure - {task_name}: {error_message}")


@celery_app.task
def test_celery_connection():
    """Test task to verify Celery is working."""
    return "Celery is working correctly!"