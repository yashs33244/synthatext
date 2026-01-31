#!/bin/bash
set -e

echo "🔄 Updating Production Deployment..."
echo ""

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Check if files exist
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: $COMPOSE_FILE not found!"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    exit 1
fi

echo "📋 Using:"
echo "  - Compose file: $COMPOSE_FILE"
echo "  - Environment: $ENV_FILE"
echo ""

# Step 1: Stop running containers
echo "🛑 Step 1: Stopping running containers..."
docker compose -f "$COMPOSE_FILE" down
echo "✅ Containers stopped"
echo ""

# Step 2: Remove all old images (force fresh pull)
echo "🗑️  Step 2: Removing old images..."
docker images | grep yashs3324/synthatext | awk '{print $1":"$2}' | xargs -r docker rmi 2>/dev/null || echo "  (No old images found)"

echo "✅ Old images removed"
echo ""

# Step 3: Pull latest images
echo "📥 Step 3: Pulling latest images from DockerHub..."
docker compose -f "$COMPOSE_FILE" pull
echo "✅ Latest images pulled"
echo ""

# Step 4: Start services
echo "🚀 Step 4: Starting services..."
docker compose -f "$COMPOSE_FILE" up -d
echo "✅ Services started"
echo ""

# Step 5: Wait for services to be healthy
echo "⏳ Step 5: Waiting for services to be healthy..."
sleep 5

# Check status
echo ""
echo "📊 Current Status:"
docker compose -f "$COMPOSE_FILE" ps
echo ""

# Step 6: Cleanup dangling images
echo "🧹 Step 6: Cleaning up dangling images..."
docker image prune -f
echo "✅ Cleanup complete"
echo ""

echo "✅ Production update complete!"
echo ""
echo "📝 Useful commands:"
echo "  View logs:     docker compose -f $COMPOSE_FILE logs -f"
echo "  Check status:  docker compose -f $COMPOSE_FILE ps"
echo "  Stop all:      docker compose -f $COMPOSE_FILE down"
echo ""
