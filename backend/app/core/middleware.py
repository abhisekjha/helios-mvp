"""
Security middleware for rate limiting and request validation.
"""

import time
from collections import defaultdict, deque
from typing import Dict, Deque
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Simple in-memory rate limiter.
    In production, use Redis or similar for distributed rate limiting.
    """
    
    def __init__(self, max_requests: int = 5, window_seconds: int = 300):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum requests allowed in the time window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, Deque[float]] = defaultdict(deque)
    
    def is_allowed(self, identifier: str) -> bool:
        """
        Check if a request is allowed based on rate limiting.
        
        Args:
            identifier: Unique identifier (usually IP address)
            
        Returns:
            bool: True if request is allowed, False otherwise
        """
        now = time.time()
        requests = self.requests[identifier]
        
        # Remove old requests outside the window
        while requests and requests[0] <= now - self.window_seconds:
            requests.popleft()
        
        # Check if limit exceeded
        if len(requests) >= self.max_requests:
            return False
        
        # Add current request
        requests.append(now)
        return True
    
    def get_retry_after(self, identifier: str) -> int:
        """
        Get the number of seconds until the next request is allowed.
        
        Args:
            identifier: Unique identifier
            
        Returns:
            int: Seconds until next request is allowed
        """
        requests = self.requests[identifier]
        if not requests:
            return 0
        
        oldest_request = requests[0]
        return max(0, int(self.window_seconds - (time.time() - oldest_request)))


# Global rate limiters for different endpoints
auth_rate_limiter = RateLimiter(max_requests=5, window_seconds=300)  # 5 attempts per 5 minutes
registration_rate_limiter = RateLimiter(max_requests=3, window_seconds=3600)  # 3 attempts per hour


async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware to apply rate limiting to authentication endpoints.
    
    Args:
        request: FastAPI request object
        call_next: Next middleware/endpoint in the chain
        
    Returns:
        Response from the next handler or rate limit error
    """
    path = request.url.path
    client_ip = request.client.host if request.client else "unknown"
    
    # Apply rate limiting to auth endpoints
    if path.startswith("/api/v1/auth/"):
        if path.endswith("/login"):
            if not auth_rate_limiter.is_allowed(client_ip):
                retry_after = auth_rate_limiter.get_retry_after(client_ip)
                logger.warning(f"Rate limit exceeded for login from IP: {client_ip}")
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Too many login attempts. Please try again later.",
                        "retry_after": retry_after
                    },
                    headers={"Retry-After": str(retry_after)}
                )
        
        elif path.endswith("/register"):
            if not registration_rate_limiter.is_allowed(client_ip):
                retry_after = registration_rate_limiter.get_retry_after(client_ip)
                logger.warning(f"Rate limit exceeded for registration from IP: {client_ip}")
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Too many registration attempts. Please try again later.",
                        "retry_after": retry_after
                    },
                    headers={"Retry-After": str(retry_after)}
                )
    
    response = await call_next(request)
    return response


class SecurityHeaders:
    """Security headers middleware"""
    
    @staticmethod
    async def add_security_headers(request: Request, call_next):
        """
        Add security headers to all responses.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/endpoint in the chain
            
        Returns:
            Response with added security headers
        """
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response
