#!/bin/bash

# Start Redis server for Helios MVP
# Run this script from the project root directory

echo "🚀 Starting Redis server locally..."

REDIS_DIR="/Users/ajha/snapdev/helios-mvp/redis-local"
cd "$REDIS_DIR"

# Start Redis server
./redis-server redis.conf
