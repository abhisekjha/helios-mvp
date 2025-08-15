#!/bin/bash

# Quick setup script for Helios MVP AI services
# This script will start Redis and Celery in the correct order

echo "🔧 Setting up Helios MVP AI Services..."
echo "=================================="

# Check if Redis is running
echo "1. Checking Redis connection..."
/Users/ajha/snapdev/helios-mvp/redis-local/redis-cli ping 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Redis is already running"
else
    echo "❌ Redis is not running"
    echo ""
    echo "Please run Redis in a separate terminal:"
    echo "cd /Users/ajha/snapdev/helios-mvp"
    echo "./start_redis.sh"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "2. Starting Celery worker..."
cd /Users/ajha/snapdev/helios-mvp/backend
./start_celery.sh
