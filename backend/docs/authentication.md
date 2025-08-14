# Authentication System Documentation

## Overview

The authentication system has been significantly improved with enhanced security features, better error handling, and comprehensive logging. This document explains the current implementation and improvements made.

## Features

### 1. Enhanced Login Endpoint (`/api/v1/auth/login`)

**Improvements:**
- **Better Security**: Checks for both authentication failure and inactive users
- **Logging**: Comprehensive logging of login attempts, successes, and failures
- **Client IP Tracking**: Logs client IP addresses for security monitoring
- **Enhanced Token Response**: Includes token expiration time
- **Rate Limiting**: Protected against brute force attacks

**Request Format:**
```json
{
  "username": "user@example.com",  // Note: OAuth2 spec uses 'username' but accepts email
  "password": "securepassword"
}
```

**Response Format:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800  // seconds until expiration
}
```

### 2. User Registration Endpoint (`/api/v1/auth/register`)

**New Feature - Previously Missing**

**Security Features:**
- **Password Validation**: Enforces strong password requirements
- **Password Confirmation**: Ensures passwords match
- **Email Validation**: Uses Pydantic EmailStr for proper email validation
- **Duplicate Prevention**: Checks for existing users

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one digit

**Request Format:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "confirm_password": "SecurePass123"
}
```

### 3. Token Verification Endpoint (`/api/v1/auth/verify-token`)

**New Feature**
- Verifies token validity
- Returns current user information
- Useful for frontend token validation

### 4. Logout Endpoint (`/api/v1/auth/logout`)

**New Feature**
- Provides proper logout logging
- Placeholder for future token blacklisting

### 5. Password Reset Request (`/api/v1/auth/password-reset-request`)

**New Feature - Placeholder Implementation**
- Security-focused design (doesn't reveal if email exists)
- Comprehensive logging
- Ready for email integration

## Security Improvements

### 1. Enhanced JWT Tokens

**Improvements in `app/core/security.py`:**
- Added token type identification (`access` vs `refresh`)
- Added issued-at timestamp (`iat`)
- Support for refresh tokens (7-day expiration)
- Better token structure

### 2. Password Security

**New Functions:**
- `validate_password_strength()`: Comprehensive password validation with scoring
- `generate_password_reset_token()`: Secure random token generation
- Enhanced password hashing with bcrypt

### 3. Rate Limiting Middleware

**New File: `app/core/middleware.py`**

**Features:**
- **Login Rate Limiting**: 5 attempts per 5 minutes per IP
- **Registration Rate Limiting**: 3 attempts per hour per IP  
- **Memory-based**: Suitable for development (use Redis in production)
- **Configurable**: Easy to adjust limits and time windows

### 4. Security Headers Middleware

**Features:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Database Schema Updates

### Updated User Models

**`app/schemas/user.py` Improvements:**
- Better type safety with `Role` enum
- Separated public and internal user models
- Enhanced validation
- Added `UserProfile` for extended information

**`app/schemas/token.py` Improvements:**
- Added `expires_in` field
- Support for refresh tokens
- Better documentation

## Logging and Monitoring

### What's Logged:
- All login attempts (success/failure) with IP addresses
- Registration attempts
- Password reset requests
- User logout events
- Rate limiting violations

### Log Levels:
- **INFO**: Successful operations
- **WARNING**: Failed attempts, rate limiting, suspicious activity
- **ERROR**: System errors (to be added)

## Usage Examples

### 1. User Registration

```python
import requests

response = requests.post("http://localhost:8000/api/v1/auth/register", json={
    "email": "user@example.com",
    "password": "SecurePass123",
    "confirm_password": "SecurePass123"
})

if response.status_code == 200:
    print("Registration successful")
    print(response.json())
```

### 2. User Login

```python
import requests

response = requests.post("http://localhost:8000/api/v1/auth/login", data={
    "username": "user@example.com",  # OAuth2 format
    "password": "SecurePass123"
})

if response.status_code == 200:
    token_data = response.json()
    access_token = token_data["access_token"]
    print(f"Login successful, token expires in {token_data['expires_in']} seconds")
```

### 3. Authenticated Requests

```python
headers = {"Authorization": f"Bearer {access_token}"}
response = requests.get("http://localhost:8000/api/v1/users/me", headers=headers)
```

## Production Recommendations

### 1. Rate Limiting
- Replace in-memory rate limiter with Redis-based solution
- Implement distributed rate limiting for multiple server instances
- Add more granular rate limiting (per user, per endpoint)

### 2. Token Management
- Implement refresh token rotation
- Add token blacklisting on logout
- Consider shorter access token expiration (15-30 minutes)

### 3. Password Reset
- Integrate with email service (SendGrid, AWS SES, etc.)
- Implement secure token storage with expiration
- Add password reset confirmation

### 4. Enhanced Security
- Add CAPTCHA for repeated failed attempts
- Implement account lockout after multiple failures
- Add two-factor authentication (2FA)
- Monitor for credential stuffing attacks

### 5. Database Security
- Add indexes on email field for faster lookups
- Consider adding created_at and updated_at timestamps
- Implement soft delete for user accounts

### 6. Monitoring
- Set up alerts for unusual authentication patterns
- Monitor rate limiting metrics
- Track token usage patterns

## Error Codes and Responses

| Status Code | Scenario | Response |
|-------------|----------|----------|
| 200 | Successful operation | Success data |
| 400 | Invalid input, inactive user, validation errors | Error details |
| 401 | Invalid credentials | "Incorrect email or password" |
| 403 | Token validation failed | "Could not validate credentials" |
| 422 | Request validation error | Validation error details |
| 429 | Rate limit exceeded | Rate limit error with retry-after |

## Migration Notes

### Breaking Changes:
1. **Token Response**: Now includes `expires_in` field
2. **User Schema**: Role field now uses enum instead of string
3. **Password Validation**: Stricter requirements for new registrations

### Backward Compatibility:
- Existing login endpoint maintains OAuth2 compatibility
- Existing tokens remain valid
- No database migration required for existing users

## Testing

### Test Cases to Implement:
1. **Authentication Tests**
   - Valid login
   - Invalid credentials
   - Inactive user login
   - Token expiration

2. **Registration Tests**
   - Valid registration
   - Duplicate email
   - Weak password
   - Password mismatch

3. **Rate Limiting Tests**
   - Exceed login attempts
   - Exceed registration attempts
   - Rate limit reset

4. **Security Tests**
   - Token manipulation
   - SQL injection attempts
   - XSS prevention

## Configuration

### Environment Variables Required:
```env
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=mongodb://localhost:27017/
MONGODB_DB_NAME=your_db_name
```

### Optional Configuration:
```env
# Rate limiting (if made configurable)
AUTH_RATE_LIMIT_REQUESTS=5
AUTH_RATE_LIMIT_WINDOW=300
REGISTRATION_RATE_LIMIT_REQUESTS=3
REGISTRATION_RATE_LIMIT_WINDOW=3600
```

This improved authentication system provides a solid foundation for a secure web application with room for future enhancements based on specific requirements.
