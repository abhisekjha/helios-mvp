from typing import Optional, List
from pymongo.database import Database
from bson.objectid import ObjectId
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

def get_user_by_email(db: Database, email: str) -> Optional[User]:
    """
    Get a user by email.

    :param db: The database session.
    :param email: The email of the user to retrieve.
    :return: The user, or None if not found.
    """
    user_doc = db.users.find_one({"email": email})
    if user_doc:
        user_doc["_id"] = str(user_doc["_id"])
        return User(**user_doc)
    return None

def get_user_by_id(db: Database, user_id: str) -> Optional[User]:
    """
    Get a user by ID.
    :param db: The database session.
    :param user_id: The ID of the user to retrieve.
    :return: The user, or None if not found.
    """
    user_doc = db.users.find_one({"_id": ObjectId(user_id)})
    if user_doc:
        user_doc["_id"] = str(user_doc["_id"])
        return User(**user_doc)
    return None

def authenticate_user(db: Database, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user.

    :param db: The database session.
    :param email: The email of the user to authenticate.
    :param password: The password of the user to authenticate.
    :return: The authenticated user, or None if authentication fails.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_user(db: Database, user_in: UserCreate) -> User:
    """
    Create a new user.

    :param db: The database session.
    :param user_in: The user creation data.
    :return: The created user.
    """
    hashed_password = get_password_hash(user_in.password)
    user_doc = {
        "email": user_in.email,
        "hashed_password": hashed_password,
        "is_active": True,
        "role": user_in.role,
        "manager_id": user_in.manager_id,
    }
    result = db.users.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    return User(**user_doc)


def update_user(db: Database, *, user: User, user_in: UserUpdate) -> User:
    """
    Update a user.

    :param db: The database session.
    :param user: The user to update.
    :param user_in: The user update data.
    :return: The updated user.
    """
    user_data = user.model_dump()
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        user_data[field] = value
    
    db.users.update_one({"_id": ObjectId(user.id)}, {"$set": user_data})
    return get_user_by_id(db, user.id)


def get_subordinates(db: Database, manager_id: str) -> List[User]:
    """
    Get all subordinates for a manager.

    :param db: The database session.
    :param manager_id: The ID of the manager.
    :return: A list of subordinates.
    """
    subordinates_cursor = db.users.find({"manager_id": manager_id})
    users = []
    for sub_doc in subordinates_cursor:
        sub_doc["_id"] = str(sub_doc["_id"])
        users.append(User(**sub_doc))
    return users


def get_manager(db: Database, user: User) -> Optional[User]:
    """
    Get the manager of a user.

    :param db: The database session.
    :param user: The user to get the manager of.
    :return: The manager of the user, or None if the user has no manager.
    """
    if not user.manager_id:
        return None
    return get_user_by_id(db, user.manager_id)

def get_all_users(db: Database) -> List[User]:
    """
    Get all users.

    :param db: The database session.
    :return: A list of all users.
    """
    users_cursor = db.users.find()
    users = []
    for user_doc in users_cursor:
        user_doc["_id"] = str(user_doc["_id"])
        users.append(User(**user_doc))
    return users