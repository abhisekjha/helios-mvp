from typing import Optional
from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class Role(str, Enum):
    DIRECTOR = "director"
    MANAGER = "manager"
    MEMBER = "member"

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    hashed_password: str
    is_active: bool = True
    role: Role = Role.MEMBER
    manager_id: Optional[str] = None