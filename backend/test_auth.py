"""
Simple test script to verify the improved authentication system.
Run this after starting the backend server to test the auth endpoints.
"""

import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1/auth"

def test_authentication_flow():
    """Test the complete authentication flow"""
    
    print("🧪 Testing Authentication System")
    print("=" * 50)
    
    # Test data
    test_user = {
        "email": "test@example.com",
        "password": "TestPass123",
        "confirm_password": "TestPass123"
    }
    
    # 1. Test Registration
    print("\n1. Testing User Registration...")
    try:
        response = requests.post(f"{BASE_URL}/register", json=test_user)
        if response.status_code == 200:
            print("✅ Registration successful")
            print(f"   Response: {response.json()}")
        elif response.status_code == 400:
            print("⚠️  User already exists (this is expected if running multiple times)")
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure the backend is running on localhost:8000")
        return
    
    # 2. Test Login
    print("\n2. Testing User Login...")
    login_data = {
        "username": test_user["email"],  # OAuth2 uses 'username' field
        "password": test_user["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login successful")
            print(f"   Token expires in: {token_data.get('expires_in', 'N/A')} seconds")
            access_token = token_data["access_token"]
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # 3. Test Token Verification
    print("\n3. Testing Token Verification...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/verify-token", headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            print("✅ Token verification successful")
            print(f"   User: {user_data['user']['email']}")
            print(f"   Role: {user_data['user']['role']}")
        else:
            print(f"❌ Token verification failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Token verification error: {e}")
    
    # 4. Test Invalid Login
    print("\n4. Testing Invalid Login...")
    invalid_login = {
        "username": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", data=invalid_login)
        if response.status_code == 401:
            print("✅ Invalid login correctly rejected")
        else:
            print(f"⚠️  Unexpected response for invalid login: {response.status_code}")
    except Exception as e:
        print(f"❌ Invalid login test error: {e}")
    
    # 5. Test Password Reset Request
    print("\n5. Testing Password Reset Request...")
    reset_data = {"email": test_user["email"]}
    
    try:
        response = requests.post(f"{BASE_URL}/password-reset-request", json=reset_data)
        if response.status_code == 200:
            print("✅ Password reset request successful")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Password reset request failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Password reset test error: {e}")
    
    # 6. Test Logout
    print("\n6. Testing Logout...")
    try:
        response = requests.post(f"{BASE_URL}/logout", headers=headers)
        if response.status_code == 200:
            print("✅ Logout successful")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Logout failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Logout test error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Authentication test completed!")


def test_password_validation():
    """Test password validation"""
    
    print("\n🔒 Testing Password Validation")
    print("=" * 50)
    
    weak_passwords = [
        "123",           # Too short
        "password",      # No uppercase, no numbers
        "PASSWORD",      # No lowercase, no numbers
        "Password",      # No numbers
        "pass word 1",   # Contains space (should be handled)
    ]
    
    for password in weak_passwords:
        test_data = {
            "email": "test_weak@example.com",
            "password": password,
            "confirm_password": password
        }
        
        print(f"\nTesting weak password: '{password}'")
        try:
            response = requests.post(f"{BASE_URL}/register", json=test_data)
            if response.status_code == 422:
                print("✅ Weak password correctly rejected")
                error_details = response.json()
                if "detail" in error_details:
                    for error in error_details["detail"]:
                        if "msg" in error:
                            print(f"   Reason: {error['msg']}")
            else:
                print(f"⚠️  Unexpected response: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing password: {e}")


if __name__ == "__main__":
    # Test main authentication flow
    test_authentication_flow()
    
    # Test password validation
    test_password_validation()
    
    print("\n💡 Tips:")
    print("   - Check server logs for detailed authentication activity")
    print("   - Rate limiting will kick in after multiple attempts")
    print("   - Use different test emails if testing multiple times")
