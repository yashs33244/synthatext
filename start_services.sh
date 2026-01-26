#!/bin/bash

# PPT Generation Service Startup Script
# Run this script to start all required services

set -e

echo "🚀 Starting PPT Generation Services..."
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Create logs directory
mkdir -p logs

# Source conda
source ~/.zshrc 2>/dev/null || true
conda activate ppt

# Load environment variables
source .env

echo "1️⃣ Checking Redis..."
if brew services list | grep redis | grep started > /dev/null 2>&1; then
    echo "   ✅ Redis is running"
else
    echo "   🔄 Starting Redis..."
    brew services start redis
    sleep 2
    echo "   ✅ Redis started"
fi

echo ""
echo "2️⃣ Checking Backend API..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   ✅ Backend API is running on port 8000"
else
    echo "   🔄 Starting Backend API..."
    cd backend
    nohup python main.py > ../logs/backend.log 2>&1 &
    cd ..
    sleep 3
    if curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        echo "   ✅ Backend API started successfully"
    else
        echo "   ❌ Backend API failed to start. Check logs/backend.log"
        exit 1
    fi
fi

echo ""
echo "3️⃣ Checking Celery Worker..."
if ps aux | grep "celery.*worker" | grep -v grep > /dev/null 2>&1; then
    echo "   ⚠️  Celery worker already running. Restarting..."
    pkill -f "celery.*worker" || true
    sleep 2
fi

echo "   🔄 Starting Celery Worker..."
cd backend
nohup celery -A app.celery_app worker --loglevel=info --pool=solo > ../logs/celery.log 2>&1 &
cd ..
sleep 3

if ps aux | grep "celery.*worker" | grep -v grep > /dev/null 2>&1; then
    echo "   ✅ Celery worker started successfully"
else
    echo "   ❌ Celery worker failed to start. Check logs/celery.log"
    exit 1
fi

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📊 Service Status:"
echo "   - Redis: running"
echo "   - Backend API: http://localhost:8000"
echo "   - Celery Worker: running"
echo ""
echo "📝 Logs:"
echo "   - Backend: logs/backend.log"
echo "   - Celery: logs/celery.log"
echo ""
echo "🛑 To stop services:"
echo "   pkill -f 'python main.py'"
echo "   pkill -f 'celery.*worker'"
echo "   brew services stop redis"
echo ""
