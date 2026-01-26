#!/bin/bash

echo "🔄 Restarting PPT Generation Services..."

# Kill existing processes
echo "📌 Stopping existing services..."
pkill -f "uvicorn main:app" || true
pkill -f "celery -A app.celery_app worker" || true
sleep 2

# Activate conda environment
source ~/.zshrc
conda activate ppt

# Source environment variables
cd "$(dirname "$0")"
source .env

# Start backend
echo "🚀 Starting FastAPI backend..."
cd backend
nohup python main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

# Start Celery worker
echo "🔨 Starting Celery worker..."
cd ..
nohup celery -A backend.app.celery_app worker --loglevel=info > logs/celery.log 2>&1 &
CELERY_PID=$!
echo "   Celery PID: $CELERY_PID"

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📊 Service Status:"
echo "   - Backend: http://localhost:8000"
echo "   - Backend PID: $BACKEND_PID"
echo "   - Celery PID: $CELERY_PID"
echo ""
echo "📝 Logs:"
echo "   - Backend: tail -f logs/backend.log"
echo "   - Celery:  tail -f logs/celery.log"
echo ""
echo "🛑 To stop services:"
echo "   kill $BACKEND_PID $CELERY_PID"
