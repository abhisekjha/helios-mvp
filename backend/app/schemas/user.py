from typing import Optional
from pydantic import BaseModel, EmailStr, validator
from app.models.user import Role


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: Role = Role.MEMBER
    manager_id: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[Role] = None
    manager_id: Optional[str] = None
    is_active: Optional[bool] = None


class UserInDB(UserBase):
    """User model with hashed password for internal use"""
    id: str
    hashed_password: str
    is_active: bool
    role: Role
    manager_id: Optional[str] = None


class User(UserBase):
    """Public user model without sensitive data"""
    id: str
    is_active: bool
    role: Role
    manager_id: Optional[str] = None
 
    class Config:
        from_attributes = True


class UserProfile(User):
    """Extended user profile with additional information"""
    created_at: Optional[str] = None
    last_login: Optional[str] = None