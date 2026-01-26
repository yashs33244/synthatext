# 🚀 Service Management Guide

## Quick Start

### Start All Services
```bash
./start_services.sh
```

This will automatically start:
- ✅ Redis (message broker)
- ✅ Backend API (FastAPI on port 8000)
- ✅ Celery Worker (task processor)

---

## Manual Service Management

### Check Service Status

**Backend API:**
```bash
curl http://localhost:8000/api/v1/health
```

**Celery Worker:**
```bash
ps aux | grep "celery worker" | grep -v grep
```

**Redis:**
```bash
/opt/homebrew/opt/redis/bin/redis-cli ping
# Should return: PONG
```

---

## Stop Services

### Stop All Services
```bash
# Stop Backend
pkill -f "python main.py"

# Stop Celery Worker
pkill -f "celery.*worker"

# Stop Redis
brew services stop redis
```

### Stop Individual Services

**Backend Only:**
```bash
lsof -ti:8000 | xargs kill -9
```

**Celery Worker Only:**
```bash
pkill -f "celery.*worker"
```

---

## Restart Services

### Full Restart (Recommended)
```bash
# Stop all
pkill -f "python main.py"
pkill -f "celery.*worker"

# Start all
./start_services.sh
```

### Restart Celery Only
```bash
pkill -f "celery.*worker"
sleep 2
source ~/.zshrc && conda activate ppt && cd backend && source ../.env
nohup celery -A app.celery_app worker --loglevel=info --pool=solo > ../logs/celery.log 2>&1 &
```

---

## Troubleshooting

### Jobs Stuck in "Pending"

**Cause:** Celery worker is not running

**Fix:**
```bash
# Check if Celery is running
ps aux | grep "celery worker" | grep -v grep

# If not running, start it
./start_services.sh
```

### Backend Not Responding

**Check logs:**
```bash
tail -50 logs/backend.log
```

**Restart:**
```bash
pkill -f "python main.py"
./start_services.sh
```

### Celery Worker Crashed

**Check logs:**
```bash
tail -50 logs/celery.log
```

**Common issues:**
- Out of memory → Reduce concurrent tasks
- Import errors → Check Python environment
- Redis connection → Verify Redis is running

**Fix:**
```bash
pkill -f "celery.*worker"
cd backend
celery -A app.celery_app worker --loglevel=info --pool=solo > ../logs/celery.log 2>&1 &
```

---

## View Logs in Real-Time

**Backend:**
```bash
tail -f logs/backend.log
```

**Celery:**
```bash
tail -f logs/celery.log
```

**Both:**
```bash
tail -f logs/backend.log logs/celery.log
```

---

## Environment Setup

### Conda Environment
```bash
source ~/.zshrc
conda activate ppt
```

### Environment Variables
```bash
source .env
```

---

## Health Checks

### Full System Health Check
```bash
echo "=== Redis ===" && /opt/homebrew/opt/redis/bin/redis-cli ping
echo ""
echo "=== Backend API ===" && curl -s http://localhost:8000/api/v1/health | python -m json.tool
echo ""
echo "=== Celery Worker ===" && ps aux | grep "celery worker" | grep -v grep || echo "NOT RUNNING"
```

---

## Production Deployment

For production, use a process manager like **supervisord** or **systemd**:

### Example supervisord configuration:
```ini
[program:ppt-backend]
command=/path/to/conda/envs/ppt/bin/python main.py
directory=/path/to/backend
autostart=true
autorestart=true
stdout_logfile=/path/to/logs/backend.log

[program:ppt-celery]
command=/path/to/conda/envs/ppt/bin/celery -A app.celery_app worker --loglevel=info
directory=/path/to/backend
autostart=true
autorestart=true
stdout_logfile=/path/to/logs/celery.log
```

---

## Important Notes

⚠️ **Celery Worker Must Be Running** for jobs to process

⚠️ **Redis Must Be Running** for Celery to work

⚠️ **Backend Hot Reloading:** Code changes are auto-detected (uvicorn --reload)

⚠️ **Celery NO Hot Reloading:** Must restart Celery after code changes to task files

---

## Quick Reference

| Service | Port | Check Command | Log File |
|---------|------|---------------|----------|
| Backend API | 8000 | `curl localhost:8000/api/v1/health` | `logs/backend.log` |
| Celery Worker | - | `ps aux \| grep celery` | `logs/celery.log` |
| Redis | 6379 | `redis-cli ping` | `/opt/homebrew/var/log/redis.log` |

---

**Need Help?** Check the logs first:
```bash
tail -50 logs/backend.log logs/celery.log
```
