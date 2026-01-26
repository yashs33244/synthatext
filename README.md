# Synthatext - AI Presentation Generator

Modern AI-powered platform for generating professional presentations from documents.

---

## 🚀 Quick Start

### With Docker (Recommended)
```bash
# 1. Configure environment
cp .env.production.example .env.production
nano .env.production  # Add your secrets

# 2. Run deployment script
./docker-start.sh
```

### Manual Setup
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🏗️ Architecture

- **Landing Page** (`synthatext.itsyash.space`) - Marketing + Auth
- **Main App** (`app-synthatext.itsyash.space`) - Core functionality
- **Backend API** (`api-synthatext.itsyash.space`) - Business logic

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

---

## 📖 Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - OAuth configuration
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DESIGN_UPDATES.md](./DESIGN_UPDATES.md) - UI/UX design system

---

## 🛠️ Tech Stack

### Frontend
- Next.js 15
- React 19
- TanStack Query
- Tailwind CSS
- Apple HIG Design System

### Backend
- FastAPI
- SQLAlchemy
- Celery
- PostgreSQL
- Redis
- AWS S3

### AI
- Anthropic Claude
- Google Gemini

---

## 📦 Services

| Service | Port | Purpose |
|---------|------|---------|
| Landing | 3000 | Marketing, login, signup |
| Main App | 3001 | PPT generation dashboard |
| Backend | 8000 | API, auth, processing |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Queue, cache |

---

## ⚙️ Configuration

### Required Environment Variables

**AWS S3:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`

**AI APIs:**
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

**Auth:**
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## 🔐 Security

- Session duration: **6 hours**
- JWT access token: **6 hours**
- HTTPS enforced in production
- OAuth 2.0 with Google
- HTTP-only secure cookies

---

## 📝 License

Proprietary - Binocs

---

*For detailed setup instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)*
