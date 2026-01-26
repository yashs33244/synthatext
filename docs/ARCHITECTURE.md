# Synthatext - Architecture & Deployment

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
└────────┬───────────────────────────────────────────────┬─────────┘
         │                                               │
         │                                               │
         ▼                                               ▼
┌──────────────────────┐                      ┌──────────────────────┐
│   LANDING PAGE       │                      │    MAIN APP          │
│  (Port 3000)         │                      │   (Port 3001)        │
│                      │                      │                      │
│  • Homepage          │                      │  • Dashboard         │
│  • Login/Signup      │   ──Redirect──>      │  • PPT Generation    │
│  • Marketing         │  (after auth)        │  • Job Management    │
│                      │                      │  • Profile/Settings  │
│  synthatext.         │                      │  app.synthatext.     │
│  itsyash.space       │                      │  itsyash.space       │
└──────────┬───────────┘                      └──────────┬───────────┘
           │                                             │
           │                                             │
           │      ┌──────────────────────────┐          │
           └─────>│   BACKEND API            │<─────────┘
                  │   (Port 8000)            │
                  │                          │
                  │  • Authentication        │
                  │  • PPT Generation        │
                  │  • Job Processing        │
                  │  • S3 Storage            │
                  │                          │
                  │  api.synthatext.         │
                  │  itsyash.space           │
                  └────────┬─────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐   ┌──────────┐
    │PostgreSQL│    │  Redis   │   │ Celery   │
    │  (5432)  │    │  (6379)  │   │ Worker   │
    └──────────┘    └──────────┘   └──────────┘
```

---

## 🔄 Authentication Flow

```
1. User visits: synthatext.itsyash.space
   └─> Landing page loads

2. User clicks "Login" or "Sign Up"
   └─> Form on landing page

3. Landing page → POST api-synthatext.itsyash.space/auth/login
   └─> Backend validates credentials
   └─> Backend sets session cookie (6 hours)
   └─> Backend returns: { accessToken, refreshToken, user }

4. Landing page receives tokens
   └─> Stores tokens (optional, for API calls)
   └─> Redirects to: app-synthatext.itsyash.space/dashboard

5. Main app receives redirect
   └─> Has session cookie from backend
   └─> Can make authenticated API calls
   └─> User is logged in for 6 hours
```

### Google OAuth Flow
```
1. User clicks "Sign in with Google" on landing page
   └─> Landing redirects to: api-synthatext.itsyash.space/auth/oauth/google

2. Backend redirects to Google OAuth
   └─> User authorizes

3. Google redirects to: api-synthatext.itsyash.space/api/auth/google/callback
   └─> Backend processes OAuth
   └─> Backend creates/updates user
   └─> Backend sets session cookie
   └─> Backend redirects to: app-synthatext.itsyash.space/dashboard

4. User lands on main app dashboard
   └─> Session cookie is active
   └─> User is authenticated
```

---

## 📦 Services Overview

### 1. Landing Page (synthatext-fe-landing)
**Purpose:** Marketing, login, signup  
**Tech:** Next.js 15, React 19  
**Port:** 3000  
**Key Files:**
- `lib/config.ts` - API configuration
- `lib/auth-service.ts` - Auth API calls to backend
- `.env.local` - Environment config

**Removed Dependencies:**
- Prisma (no database in frontend)
- NextAuth (backend handles auth)
- Bcrypt, JWT libraries (backend handles)
- API routes (all moved to backend)

### 2. Main App (frontend-shared)
**Purpose:** Core application functionality  
**Tech:** Next.js 15, React 19, TanStack Query  
**Port:** 3001  
**Features:**
- Dashboard with PPT generation form
- Job list and management
- Live slide preview
- Slide editing
- Profile management

### 3. Backend API
**Purpose:** All business logic, auth, PPT generation  
**Tech:** FastAPI, SQLAlchemy, Celery  
**Port:** 8000  
**Endpoints:**
- `/auth/*` - Authentication
- `/api/v1/*` - PPT generation (protected)
- `/api/auth/google/callback` - OAuth callback

### 4. Supporting Services
- **PostgreSQL:** User data, jobs, sessions
- **Redis:** Celery broker, caching
- **Celery Worker:** Async HTML generation & conversion

---

## 🔒 Security

### Session Management
- **Duration:** 6 hours
- **Storage:** HTTP-only cookies (secure)
- **JWT:** Access tokens for API calls
- **Refresh:** 7-day refresh tokens

### CORS Configuration
Backend allows:
- `http://localhost:3000` (landing dev)
- `http://localhost:3001` (app dev)
- `https://synthatext.itsyash.space` (landing prod)
- `https://app-synthatext.itsyash.space` (app prod)

### OAuth Security
- State parameter validation
- PKCE flow (if implemented)
- Secure redirect URI validation
- Token exchange over HTTPS only

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),              -- NEW: From Google OAuth
    avatar TEXT,                    -- NEW: Profile picture URL
    email_verified BOOLEAN DEFAULT FALSE,
    locked BOOLEAN DEFAULT FALSE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    refresh_token TEXT,
    device_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP,           -- Set to 6 hours from creation
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🌐 Environment Variables

### Development

**Landing Page** (`.env.local`):
```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_LANDING_URL=http://localhost:3000
```

**Main App** (`.env`):
```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000
NEXT_PUBLIC_PPT_API_URL=http://localhost:8000
```

**Backend** (`.env`):
```env
DATABASE_URL=postgresql://pptuser:pptpass@localhost:5432/pptdb
REDIS_URL=redis://localhost:6379/0
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=360
SESSION_EXPIRE_HOURS=6
FRONTEND_URL=http://localhost:3001
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

### Production

All configured in `docker-compose.yml` and `.env.production`

---

## 🚀 Quick Start

### Local Development
```bash
# Terminal 1: Backend
cd backend
source ../.env
conda run -n ppt uvicorn app.main:app --reload --port 8000

# Terminal 2: Celery Worker
cd backend
source ../.env
conda run -n ppt celery -A app.celery_app worker --loglevel=info --pool=solo

# Terminal 3: Landing Page
cd frontend/web/synthatext-fe-landing
npm run dev

# Terminal 4: Main App
cd frontend/frontend-shared
npm run dev
```

Access:
- Landing: http://localhost:3000
- App: http://localhost:3001 (after login)
- API: http://localhost:8000

### Docker Production
```bash
# 1. Configure
cp .env.production.example .env.production
# Edit .env.production with your secrets

# 2. Build & Deploy
docker-compose build
docker-compose up -d

# 3. Apply Migration
docker-compose exec backend python apply_migration.py

# 4. Check Status
docker-compose ps
docker-compose logs -f
```

---

## 📊 Monitoring

### Health Checks
```bash
# Backend
curl http://localhost:8000/api/v1/health

# Landing
curl http://localhost:3000

# App
curl http://localhost:3001

# PostgreSQL
docker-compose exec postgres pg_isready -U pptuser

# Redis
docker-compose exec redis redis-cli ping

# Celery
docker-compose exec backend celery -A app.celery_app inspect active
```

---

## 🐛 Common Issues

### Issue: Google OAuth fails with redirect_uri_mismatch
**Solution:** Add production callback URI to Google Console:
`https://api-synthatext.itsyash.space/api/auth/google/callback`

### Issue: Session not persisting across landing → app
**Solution:** Ensure both domains use same root domain or configure CORS properly

### Issue: Frontend-shared deleted
**Solution:** The frontend-shared folder was deleted in recent changes. You may need to restore it or the landing page will serve as both landing and app.

### Issue: Celery not processing jobs
**Solution:**
```bash
docker-compose logs celery-worker
docker-compose restart celery-worker
```

---

*Last Updated: January 25, 2026*
