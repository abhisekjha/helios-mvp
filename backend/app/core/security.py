from datetime import datetime, timedelta
from typing import Any, Union, Optional
import secrets
import string

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        subject: The subject (usually user ID) to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        str: Encoded JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    """
    Create a JWT refresh token with longer expiration.
    
    Args:
        subject: The subject (usually user ID) to encode in the token
        
    Returns:
        str: Encoded JWT refresh token
    """
    expire = datetime.utcnow() + timedelta(days=7)  # 7 days for refresh tokens
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password to verify against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        str: The hashed password
    """
    return pwd_context.hash(password)


def generate_password_reset_token() -> str:
    """
    Generate a secure random token for password reset.
    
    Returns:
        str: A secure random token
    """
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))


def validate_password_strength(password: str) -> dict:
    """
    Validate password strength and return detailed feedback.
    
    Args:
        password: The password to validate
        
    Returns:
        dict: Validation result with strength score and feedback
    """
    feedback = []
    score = 0
    
    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Password should be at least 8 characters long")
    
    if any(c.isupper() for c in password):
        score += 1
    else:
        feedback.append("Password should contain at least one uppercase letter")
    
    if any(c.islower() for c in password):
        score += 1
    else:
        feedback.append("Password should contain at least one lowercase letter")
    
    if any(c.isdigit() for c in password):
        score += 1
    else:
        feedback.append("Password should contain at least one digit")
    
    if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        score += 1
        feedback.append("Great! Contains special characters")
    else:
        feedback.append("Consider adding special characters for stronger security")
    
    strength_levels = {
        0: "Very Weak",
        1: "Weak", 
        2: "Fair",
        3: "Good",
        4: "Strong",
        5: "Very Strong"
    }
    
    return {
        "score": score,
        "max_score": 5,
        "strength": strength_levels.get(score, "Unknown"),
        "feedback": feedback,
        "is_valid": score >= 3  # Require at least 3 criteria
    }