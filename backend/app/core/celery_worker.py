import csv
from celery import Celery
from app.core.config import settings
from pymongo import MongoClient
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
    client = MongoClient(settings.DATABASE_URL)
    db = client.get_default_database()
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
                goal = crud_goal.get(db, id=data_upload.goal_id)
                if goal:
                    crud_goal.update(db, db_obj=goal, obj_in=GoalUpdate(status=GoalStatus.PROCESSING))
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
def generate_plans_for_goal(goal_id: str):
    from app.services.insight_generator import InsightGenerator
    from app.services.plan_generator import PlanGenerator
    
    client = MongoClient(settings.DATABASE_URL)
    db = client.get_default_database()
    goal = None
    try:
        goal = crud_goal.get(db, id=goal_id)
        if not goal:
            return

        # This assumes a single data upload per goal for simplicity
        data_uploads = crud_data_upload.get_data_uploads_by_goal(db, goal_id=goal_id)
        if not data_uploads:
            return
        
        # This assumes a single data upload per goal for simplicity
        data_upload = data_uploads

        insight_generator = InsightGenerator(db)
        insight_ids = insight_generator.generate_insights_from_upload(str(data_upload.id))

        if insight_ids:
            plan_generator = PlanGenerator(db)
            plan_generator.generate_plans_for_goal(goal, insight_ids)
            
            crud_goal.update(db, db_obj=goal, obj_in=GoalUpdate(status=GoalStatus.AWAITING_REVIEW))
    except Exception as e:
        if goal:
            crud_goal.update(db, db_obj=goal, obj_in=GoalUpdate(status=GoalStatus.FAILED))
            notify_task_failure.delay('generate_plans_for_goal', str(e))
    finally:
        client.close()


@celery_app.task
def generate_insights_from_upload(upload_id: str):
    from app.services.insight_generator import InsightGenerator
    
    client = MongoClient(settings.DATABASE_URL)
    db = client.get_default_database()
    try:
        insight_generator = InsightGenerator(db)
        insight_generator.generate_insights_from_upload(upload_id)
        
        data_upload = crud_data_upload.get_data_upload(db, upload_id=upload_id)
        if data_upload:
            goal = crud_goal.get(db, id=data_upload.goal_id)
            if goal:
                generate_plans_for_goal.delay(data_upload.goal_id)
    except Exception as e:
        notify_task_failure.delay('generate_insights_from_upload', str(e))
    finally:
        client.close()


@celery_app.task
def notify_task_failure(task_name: str, error_message: str):
    # For now, we'll just log the failure.
    # This could be extended to send emails, push notifications, etc.
    print(f"Task {task_name} failed with error: {error_message}")