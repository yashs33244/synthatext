#!/bin/bash

# Environment Setup Script
# Usage: ./setup-env.sh [local|production]

ENV=${1:-local}

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         Setting up $ENV environment...                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ "$ENV" != "local" ] && [ "$ENV" != "production" ]; then
    echo "❌ Error: Invalid environment. Use 'local' or 'production'"
    echo "Usage: ./setup-env.sh [local|production]"
    exit 1
fi

# Backend
echo "📦 Setting up backend..."
cp backend/.env.$ENV backend/.env
echo "✅ backend/.env created from .env.$ENV"

# Main App (frontend-shared)
echo "📦 Setting up main app..."
cp frontend/web/frontend-shared/.env.$ENV frontend/web/frontend-shared/.env
echo "✅ frontend-shared/.env created from .env.$ENV"

# Landing Page
echo "📦 Setting up landing page..."
cp frontend/web/synthatext-fe-landing/.env.$ENV frontend/web/synthatext-fe-landing/.env
echo "✅ synthatext-fe-landing/.env created from .env.$ENV"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ✅ Environment setup complete!                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Environment: $ENV"
echo ""

if [ "$ENV" = "local" ]; then
    echo "🚀 Next steps:"
    echo "  1. Start backend:      cd backend && python -m uvicorn app.main:app --reload --port 8000"
    echo "  2. Start main app:     cd frontend/web/frontend-shared && npm run dev"
    echo "  3. Start landing page: cd frontend/web/synthatext-fe-landing && npm run dev"
    echo ""
    echo "URLs:"
    echo "  - Backend:  http://localhost:8000"
    echo "  - Landing:  http://localhost:3000"
    echo "  - Main App: http://localhost:3001"
else
    echo "⚠️  PRODUCTION CHECKLIST:"
    echo "  [ ] Update JWT_SECRET in backend/.env"
    echo "  [ ] Update database credentials"
    echo "  [ ] Add production Google OAuth credentials"
    echo "  [ ] Update AWS credentials"
    echo "  [ ] Add analytics IDs (GA, Mixpanel)"
    echo "  [ ] Verify all URLs use HTTPS"
    echo ""
    echo "📖 See ENV_GUIDE.md for more details"
fi
