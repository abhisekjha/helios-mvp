import requests
import time

# Define the user data
user_data = {
    "email": "director@example.com",
    "password": "directorpassword",
    "role": "director"
}

# Wait for the server to be ready
for _ in range(10):
    try:
        requests.get("http://localhost:8000/")
        break
    except requests.exceptions.ConnectionError:
        time.sleep(1)
else:
    print("Server is not ready after 10 seconds.")
    exit(1)


# Make the POST request to create the user
response = requests.post("http://localhost:8000/api/v1/users/", json=user_data)

# Check the response
if response.status_code == 200:
    print("Director user created successfully.")
else:
    print(f"Error creating director user: {response.status_code} - {response.text}")
