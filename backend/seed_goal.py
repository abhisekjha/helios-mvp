import asyncio
from datetime import datetime, timedelta
from app.db.session import get_database
from app.crud import crud_user, crud_goal
from app.schemas.goal import GoalCreate
from app.models.goal import GoalStatus

async def seed_goal():
    db = get_database()
    user = await crud_user.get_by_email(db, email="chloe@helios.com")
    if user:
        goal = await crud_goal.get_multi_by_owner(db, owner_id=user.id)
        if not goal:
            goal_in = GoalCreate(
                title="Increase Q3 Sales by 15%",
                description="Focus on increasing sales for the upcoming quarter.",
                due_date=(datetime.now() + timedelta(days=90)).isoformat(),
                status=GoalStatus.DRAFT,
            )
            await crud_goal.create_goal(db=db, obj_in=goal_in, owner_id=user.id)
            print("Goal seeded for chloe@helios.com")

if __name__ == "__main__":
    asyncio.run(seed_goal())