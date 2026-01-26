# Synthatext Deployment Guide

## 🏗️ Architecture Overview

The application is split into three main services:

1. **Landing Page** (`synthatext.itsyash.space`) - Marketing site with login/signup
2. **Main App** (`app-synthatext.itsyash.space`) - Full featured application (dashboard, PPT generation)
3. **Backend API** (`api-synthatext.itsyash.space`) - FastAPI backend with authentication

### Flow:
```
User visits Landing → Login/Signup → Backend Auth → Redirect to App → Dashboard
```

---

## 📁 Project Structure

```
general_pptx/
├── backend/                          # FastAPI backend
│   ├── app/                         # Application code
│   ├── Dockerfile                   # Backend Docker config
│   └── requirements.txt
├── frontend/
│   ├── web/synthatext-fe-landing/  # Landing page (port 3000)
│   │   ├── lib/config.ts           # API configuration
│   │   ├── lib/auth-service.ts     # Auth service
│   │   ├── Dockerfile
│   │   └── .env.local
│   └── frontend-shared/             # Main app (port 3001)
│       ├── Dockerfile
│       └── .env
├── docker-compose.yml               # Complete stack
└── .env.production                  # Production secrets
```

---

## 🚀 Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.12+
- PostgreSQL 15+
- Redis 7+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Copy and configure .env
cp ../.env .env
# Edit .env with your settings

# Run migrations
python apply_migration.py

# Start backend
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.celery_app worker --loglevel=info --pool=solo
```

### 2. Landing Page Setup
```bash
cd frontend/web/synthatext-fe-landing

# Install dependencies
npm install

# Copy and configure .env.local
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
# NEXT_PUBLIC_APP_URL=http://localhost:3001
# NEXT_PUBLIC_LANDING_URL=http://localhost:3000

# Start development server
npm run dev
```

Access at: http://localhost:3000

### 3. Main App Setup
```bash
cd frontend/frontend-shared

# Install dependencies
npm install

# Copy and configure .env
cp .env.example .env
# Edit .env:
# NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000
# NEXT_PUBLIC_PPT_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Access at: http://localhost:3001

---

## 🐳 Docker Deployment

### 1. Prepare Environment
```bash
# Copy production env file
cp .env.production.example .env.production

# Edit .env.production with your secrets:
nano .env.production
```

Required variables:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `JWT_SECRET` (generate: `openssl rand -hex 32`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### 2. Build & Run with Docker Compose
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 3. Individual Service Commands
```bash
# Backend only
docker-compose up -d backend celery-worker

# Frontend services only
docker-compose up -d landing frontend

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

---

## 🌐 Google OAuth Configuration

### Development (localhost)
In Google Cloud Console, add these authorized redirect URIs:
- `http://localhost:8000/api/auth/google/callback`

### Production
Add these authorized redirect URIs:
- `https://api-synthatext.itsyash.space/api/auth/google/callback`

### Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   - For dev: `http://localhost:8000/api/auth/google/callback`
   - For prod: `https://api-synthatext.itsyash.space/api/auth/google/callback`
6. Click **Save**

---

## 🔧 Production Deployment

### Domain Setup
Configure DNS A records:
- `synthatext.itsyash.space` → Your server IP
- `app-synthatext.itsyash.space` → Your server IP
- `api-synthatext.itsyash.space` → Your server IP

### SSL Certificates (with Traefik)
The docker-compose.yml includes Traefik labels for automatic SSL with Let's Encrypt.

If using manual nginx/Apache, use certbot:
```bash
sudo certbot --nginx -d synthatext.itsyash.space -d app-synthatext.itsyash.space -d api-synthatext.itsyash.space
```

### Nginx Configuration Example
```nginx
# Landing Page
server {
    listen 80;
    server_name synthatext.itsyash.space;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Main App
server {
    listen 80;
    server_name app-synthatext.itsyash.space;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api-synthatext.itsyash.space;
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📊 Service Ports

| Service | Port | Domain (Production) |
|---------|------|---------------------|
| Landing Page | 3000 | synthatext.itsyash.space |
| Main App | 3001 | app-synthatext.itsyash.space |
| Backend API | 8000 | api-synthatext.itsyash.space |
| PostgreSQL | 5432 | Internal only |
| Redis | 6379 | Internal only |

---

## 🧪 Testing

### Test Backend
```bash
curl http://localhost:8000/api/v1/health
```

### Test Landing Page
```bash
curl http://localhost:3000
```

### Test Main App
```bash
curl http://localhost:3001
```

### Test Complete Flow
1. Visit `http://localhost:3000`
2. Click "Sign Up"
3. Create account
4. Should redirect to `http://localhost:3001/dashboard`
5. Session cookie should be set

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Check database connection
docker-compose exec postgres psql -U pptuser -d pptdb -c "SELECT 1;"
```

### Frontend build fails
```bash
# Clear Next.js cache
cd frontend/frontend-shared
rm -rf .next node_modules
npm install
npm run build
```

### Celery worker not processing jobs
```bash
# Check Redis connection
docker-compose exec redis redis-cli ping

# Restart Celery
docker-compose restart celery-worker

# Check Celery logs
docker-compose logs celery-worker
```

### CORS issues
Ensure backend CORS is configured in `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://synthatext.itsyash.space",
        "https://app-synthatext.itsyash.space"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📦 Database Backups

```bash
# Backup
docker-compose exec postgres pg_dump -U pptuser pptdb > backup.sql

# Restore
docker-compose exec -T postgres psql -U pptuser pptdb < backup.sql
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Enable HTTPS in production
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Set up automatic backups
- [ ] Configure Google OAuth production redirect URIs
- [ ] Review CORS allowed origins
- [ ] Set up monitoring and logging

---

## 📝 Notes

- Session duration: 6 hours
- JWT access token expiration: 6 hours
- Refresh token expiration: 7 days
- File uploads stored in S3
- Database migrations in `backend/migrations/`

---

*Last Updated: January 25, 2026*
