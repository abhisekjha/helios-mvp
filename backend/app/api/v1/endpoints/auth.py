import logging
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, validator

from app.core.security import create_access_token, get_password_hash
from app.core.config import settings
from app.crud import crud_user
from app.schemas.token import Token
from app.schemas.user import UserCreate
from app.models.user import User
from app.api import deps

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()


class LoginRequest(BaseModel):
    """Login request model with email and password"""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Registration request model"""
    email: EmailStr
    password: str
    confirm_password: str
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        """Ensure password and confirm_password match"""
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v


class PasswordResetRequest(BaseModel):
    """Password reset request model"""
    email: EmailStr


@router.post("/login", response_model=Token)
async def login_for_access_token(
    request: Request,
    db: deps.Database = Depends(deps.get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Login endpoint for obtaining access token.
    
    Args:
        request: FastAPI request object for logging client info
        db: Database dependency
        form_data: OAuth2 form data containing username (email) and password
    
    Returns:
        Token: Access token and token type
    
    Raises:
        HTTPException: 401 if authentication fails
        HTTPException: 400 if user is inactive
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"Login attempt for user: {form_data.username} from IP: {client_ip}")
    
    # Authenticate user
    user = crud_user.authenticate_user(
        db, email=form_data.username, password=form_data.password
    )
    
    if not user:
        logger.warning(f"Failed login attempt for user: {form_data.username} from IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        logger.warning(f"Login attempt by inactive user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    logger.info(f"Successful login for user: {user.email}")
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # seconds
    }


@router.post("/register", response_model=dict)
async def register_user(
    request: Request,
    user_data: RegisterRequest,
    db: deps.Database = Depends(deps.get_db)
):
    """
    Register a new user account.
    
    Args:
        request: FastAPI request object for logging
        user_data: Registration data including email and password
        db: Database dependency
    
    Returns:
        dict: Success message and user info
        
    Raises:
        HTTPException: 400 if user already exists
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"Registration attempt for email: {user_data.email} from IP: {client_ip}")
    
    # Check if user already exists
    existing_user = crud_user.get_user_by_email(db, email=user_data.email)
    if existing_user:
        logger.warning(f"Registration attempt with existing email: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    user_create = UserCreate(
        email=user_data.email,
        password=user_data.password
    )
    
    user = crud_user.create_user(db, user_in=user_create)
    
    logger.info(f"Successfully registered user: {user.email}")
    
    return {
        "message": "User registered successfully",
        "user_id": user.id,
        "email": user.email
    }


@router.post("/logout")
async def logout(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Logout endpoint (mainly for logging purposes since JWT is stateless).
    
    In a production environment, you might want to:
    - Add token to blacklist
    - Store logout timestamp
    - Clear client-side tokens
    
    Args:
        current_user: Currently authenticated user
        
    Returns:
        dict: Success message
    """
    logger.info(f"User logged out: {current_user.email}")
    
    return {"message": "Successfully logged out"}


@router.post("/password-reset-request")
async def request_password_reset(
    request: Request,
    reset_data: PasswordResetRequest,
    db: deps.Database = Depends(deps.get_db)
):
    """
    Request password reset (placeholder for email-based reset).
    
    In production, this should:
    - Generate a secure reset token
    - Send reset email to user
    - Store reset token with expiration
    
    Args:
        request: FastAPI request object
        reset_data: Password reset request data
        db: Database dependency
        
    Returns:
        dict: Success message (always returns success for security)
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"Password reset requested for: {reset_data.email} from IP: {client_ip}")
    
    # Check if user exists (but don't reveal this information)
    user = crud_user.get_user_by_email(db, email=reset_data.email)
    
    if user:
        # In production: generate reset token and send email
        logger.info(f"Password reset token would be sent to: {reset_data.email}")
        pass
    else:
        logger.warning(f"Password reset requested for non-existent user: {reset_data.email}")
    
    # Always return success to prevent email enumeration
    return {
        "message": "If the email exists in our system, a password reset link has been sent"
    }


@router.get("/verify-token")
async def verify_token(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Verify if the current token is valid and return user info.
    
    Args:
        current_user: Currently authenticated user from token
        
    Returns:
        dict: User information and token validity
    """
    return {
        "valid": True,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
            "is_active": current_user.is_active
        }
    }