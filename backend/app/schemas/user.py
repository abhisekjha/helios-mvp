from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "member"
    manager_id: Optional[str] = None

class UserUpdate(BaseModel):
    role: Optional[str] = None
    manager_id: Optional[str] = None

class User(UserBase):
    id: str
    is_active: bool
    role: str
 
    class Config:
        from_attributes = True