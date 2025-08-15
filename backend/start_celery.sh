#!/bin/bash

# Start Celery Worker for Helios MVP
# This script should be run from the backend directory

echo "🚀 Starting Celery Worker for Helios MVP..."
echo "Make sure Redis is running first!"

# Activate virtual environment
source .venv/bin/activate

# Set environment variables
export PYTHONPATH=$PWD

# Start celery worker
celery -A app.core.celery_worker worker --loglevel=info --pool=solo
