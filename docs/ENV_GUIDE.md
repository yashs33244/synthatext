# Environment Variables Guide

This guide explains all environment variables for each service.

## 📂 Project Structure

```
/backend/
  ├── .env.local          # Local development
  └── .env.production     # Production deployment

/frontend/web/frontend-shared/  (Main App - Port 3001)
  ├── .env.local          # Local development
  └── .env.production     # Production deployment

/frontend/web/synthatext-fe-landing/  (Landing - Port 3000)
  ├── .env.local          # Local development
  └── .env.production     # Production deployment
```

---

## 🔧 Backend Environment Variables

### Database
- `DATABASE_URL`: PostgreSQL connection string
  - Local: `postgresql://pptuser:pptpass@localhost:5432/pptdb`
  - Prod: `postgresql://prod_user:prod_password@db.synthatext.itsyash.space:5432/synthatext_db`

### Redis
- `REDIS_URL`: Redis connection string for caching/queue
  - Local: `redis://localhost:6379/0`
  - Prod: `redis://redis.synthatext.itsyash.space:6379/0`

### AWS S3
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_REGION`: AWS region (e.g., `us-east-1`)
- `S3_BUCKET_NAME`: S3 bucket for file storage

### LLM API Keys
- `ANTHROPIC_API_KEY`: Anthropic Claude API key
- `GOOGLE_API_KEY`: Google AI API key

### Application
- `BACKEND_PORT`: Port for backend server (default: `8000`)
- `FRONTEND_URL`: Main app URL
  - Local: `http://localhost:3001`
  - Prod: `https://app-synthatext.itsyash.space`
- `LANDING_URL`: Landing page URL
  - Local: `http://localhost:3000`
  - Prod: `https://synthatext.itsyash.space`
- `ENVIRONMENT`: `development` or `production`

### Authentication
- `JWT_SECRET`: Secret key for JWT signing (CHANGE IN PRODUCTION!)
- `JWT_ALGORITHM`: JWT algorithm (default: `HS256`)
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`: Access token expiry (default: `360` = 6 hours)
- `SESSION_EXPIRE_HOURS`: Session cookie expiry (default: `6`)
- `JWT_REFRESH_TOKEN_EXPIRE_DAYS`: Refresh token expiry (default: `7`)
- `ACCOUNT_LOCKOUT_ATTEMPTS`: Failed login attempts before lockout (default: `5`)
- `ACCOUNT_LOCKOUT_DURATION_MINUTES`: Lockout duration (default: `30`)
- `VERIFICATION_TOKEN_EXPIRE_HOURS`: Email verification token expiry (default: `24`)
- `PASSWORD_RESET_TOKEN_EXPIRE_HOURS`: Password reset token expiry (default: `1`)

### Google OAuth
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: OAuth callback URL
  - Local: `http://localhost:8000/api/auth/google/callback`
  - Prod: `https://api-synthatext.itsyash.space/api/auth/google/callback`

---

## 🌐 Frontend-Shared (Main App) Environment Variables

### API URLs
- `NEXT_PUBLIC_AUTH_API_URL`: Backend auth API URL
  - Local: `http://localhost:8000`
  - Prod: `https://api-synthatext.itsyash.space`
  
- `NEXT_PUBLIC_PPT_API_URL`: Backend PPT API URL
  - Local: `http://localhost:8000`
  - Prod: `https://api-synthatext.itsyash.space`

### Application URLs
- `NEXT_PUBLIC_APP_URL`: Main app URL (itself)
  - Local: `http://localhost:3001`
  - Prod: `https://app-synthatext.itsyash.space`
  
- `NEXT_PUBLIC_LANDING_URL`: Landing page URL
  - Local: `http://localhost:3000`
  - Prod: `https://synthatext.itsyash.space`

### Node
- `NODE_ENV`: `development` or `production`

---

## 🎨 Landing Page Environment Variables

### API URLs
- `NEXT_PUBLIC_API_URL`: Backend API URL
  - Local: `http://localhost:8000`
  - Prod: `https://api-synthatext.itsyash.space`
  
- `NEXT_PUBLIC_AUTH_API_URL`: Backend auth API URL
  - Local: `http://localhost:8000`
  - Prod: `https://api-synthatext.itsyash.space`

### Application URLs
- `NEXT_PUBLIC_LANDING_URL`: Landing page URL (itself)
  - Local: `http://localhost:3000`
  - Prod: `https://synthatext.itsyash.space`
  
- `NEXT_PUBLIC_APP_URL`: Main app URL
  - Local: `http://localhost:3001`
  - Prod: `https://app-synthatext.itsyash.space`

### Node
- `NODE_ENV`: `development` or `production`

### Analytics (Optional)
- `NEXT_PUBLIC_GA_ID`: Google Analytics tracking ID
- `NEXT_PUBLIC_MIXPANEL_TOKEN`: Mixpanel token

---

## 🚀 Deployment Instructions

### Local Development

1. **Copy local env files:**
   ```bash
   # Backend
   cp backend/.env.local backend/.env
   
   # Main App
   cp frontend/web/frontend-shared/.env.local frontend/web/frontend-shared/.env
   
   # Landing Page
   cp frontend/web/synthatext-fe-landing/.env.local frontend/web/synthatext-fe-landing/.env
   ```

2. **Start services:**
   ```bash
   # Backend
   cd backend && python -m uvicorn app.main:app --reload --port 8000
   
   # Main App
   cd frontend/web/frontend-shared && npm run dev
   
   # Landing Page
   cd frontend/web/synthatext-fe-landing && npm run dev
   ```

### Production Deployment

1. **Update production env files with real values:**
   - Change `JWT_SECRET` to a secure random string
   - Update database credentials
   - Add production Google OAuth credentials
   - Update AWS credentials
   - Add analytics IDs

2. **Deploy with Docker:**
   ```bash
   # Use docker-compose with production env
   docker-compose --env-file .env.production up -d
   ```

---

## ⚠️ Security Notes

1. **NEVER commit `.env` files to git**
2. **Change `JWT_SECRET` in production** - use a long random string
3. **Use separate Google OAuth credentials** for development and production
4. **Rotate API keys** regularly
5. **Use environment-specific AWS buckets**
6. **Enable HTTPS** in production (all URLs should use `https://`)

---

## 🔗 URL Mapping

### Local Development
- Landing Page: `http://localhost:3000`
- Main App: `http://localhost:3001`
- Backend API: `http://localhost:8000`

### Production
- Landing Page: `https://synthatext.itsyash.space`
- Main App: `https://app-synthatext.itsyash.space`
- Backend API: `https://api-synthatext.itsyash.space`

---

## 📝 Notes

- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Backend variables are server-side only
- Use `.env.local` for local overrides (git-ignored)
- Use `.env.production` for deployment configuration
