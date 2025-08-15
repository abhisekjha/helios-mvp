#!/bin/bash
# Startup script for Helios backend

# Navigate to backend directory
cd "$(dirname "$0")"

# Activate virtual environment
source .venv/bin/activate

# Set Python path to current directory
export PYTHONPATH="${PWD}:${PYTHONPATH}"

# Load environment variables (optional since python-dotenv handles it)
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Start the server
uvicorn app.main:app --reload --port 8000
