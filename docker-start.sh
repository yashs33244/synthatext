#!/bin/bash

# Synthatext Docker Deployment Script

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     Synthatext - Docker Deployment                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found!"
    echo ""
    echo "Creating from template..."
    cp .env.production.example .env.production
    echo "✅ Created .env.production"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.production with your actual secrets:"
    echo "   - AWS credentials"
    echo "   - API keys (Anthropic, Google)"
    echo "   - JWT secret"
    echo "   - Google OAuth credentials"
    echo ""
    echo "Press Enter when ready to continue..."
    read
fi

# Load environment variables
set -a
source .env.production
set +a

echo "📦 Building Docker images..."
echo ""
docker-compose build

echo ""
echo "🚀 Starting services..."
echo ""
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "🔍 Checking service status..."
echo ""
docker-compose ps

echo ""
echo "📊 Applying database migrations..."
echo ""
docker-compose exec backend python apply_migration.py || echo "⚠️  Migration may have already been applied"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              ✅ DEPLOYMENT COMPLETE!                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Access your services:"
echo "   Landing:  http://localhost:3000"
echo "   App:      http://localhost:3001"
echo "   API:      http://localhost:8000/docs"
echo ""
echo "📋 Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart service:  docker-compose restart <service>"
echo "   View status:      docker-compose ps"
echo ""
echo "⚠️  Remember to update Google OAuth callback URI!"
echo "    See: GOOGLE_OAUTH_SETUP.md"
echo ""
