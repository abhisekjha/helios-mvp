from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: Optional[int] = None  # Token expiration time in seconds


class TokenData(BaseModel):
    sub: str


class RefreshToken(BaseModel):
    """Refresh token model for future implementation"""
    refresh_token: str