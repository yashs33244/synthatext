#!/bin/bash
set -e

# Generate timestamp tag to force fresh images
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🚀 Building and Pushing Production Images"
echo "=========================================="
echo ""
echo "📦 Image Tags:"
echo "   Backend:      yashs3324/synthatext-backend:latest"
echo "   Frontend App: yashs3324/synthatext-app:latest"
echo "   Landing Page: yashs3324/synthatext-landing:latest"
echo ""
echo "   (Also tagged as :latest)"
echo ""

cd /Users/yashbinocs/Desktop/binocs/htmltopptx/general_pptx

# Setup buildx
echo "📦 Setting up Docker buildx..."
docker buildx create --name multiplatform --use 2>/dev/null || docker buildx use multiplatform
docker buildx inspect --bootstrap
echo ""

# Build and push Backend
echo "🔨 Building Backend..."
docker buildx build \
  --no-cache \
  --platform linux/amd64,linux/arm64 \
  -t yashs3324/synthatext-backend:latest \
  -t yashs3324/synthatext-backend:latest \
  --push \
  ./backend
echo "✅ Backend pushed"

# Build and push Frontend App
echo ""
echo "🔨 Building Frontend App..."
docker buildx build \
  --no-cache \
  --platform linux/amd64,linux/arm64 \
  --build-arg NODE_ENV=production \
  -t yashs3324/synthatext-app:latest \
  -t yashs3324/synthatext-app:latest \
  --push \
  ./frontend/web/frontend-shared
echo "✅ Frontend App pushed"

# Build and push Landing Page
echo ""
echo "🔨 Building Landing Page..."
docker buildx build \
  --no-cache \
  --platform linux/amd64,linux/arm64 \
  --build-arg NODE_ENV=production \
  -t yashs3324/synthatext-landing:latest \
  -t yashs3324/synthatext-landing:latest \
  --push \
  ./frontend/web/synthatext-fe-landing
echo "✅ Landing Page pushed"

echo ""
echo "✅ ALL IMAGES BUILT AND PUSHED!"
echo ""
echo "📦 Images on DockerHub:"
echo "   - yashs3324/synthatext-backend:latest (and :latest)"
echo "   - yashs3324/synthatext-app:latest (and :latest)"
echo "   - yashs3324/synthatext-landing:latest (and :latest)"
echo ""
echo "🔄 Updating docker-compose files to use :latest tags..."

# Update docker-compose.yml to use timestamp tags
sed -i.bak "s|yashs3324/synthatext-backend:.*|yashs3324/synthatext-backend:latest|g" docker-compose.yml
sed -i.bak "s|yashs3324/synthatext-app.*:.*|yashs3324/synthatext-app:latest|g" docker-compose.yml
sed -i.bak "s|yashs3324/synthatext-landing.*:.*|yashs3324/synthatext-landing:latest|g" docker-compose.yml

# Update docker-compose.prod.yml
sed -i.bak "s|yashs3324/synthatext-backend:.*|yashs3324/synthatext-backend:latest|g" docker-compose.prod.yml
sed -i.bak "s|yashs3324/synthatext-app.*:.*|yashs3324/synthatext-app:latest|g" docker-compose.prod.yml
sed -i.bak "s|yashs3324/synthatext-landing.*:.*|yashs3324/synthatext-landing:latest|g" docker-compose.prod.yml

echo "✅ Docker compose files updated"
echo ""
echo "🚀 DEPLOY TO EC2:"
echo ""
echo "   1. Copy updated files to EC2:"
echo "      scp docker-compose.prod.yml .env.production update-production.sh your-ec2:~/synthatext/"
echo ""
echo "   2. SSH into EC2 and run:"
echo "      cd ~/synthatext"
echo "      docker-compose -f docker-compose.prod.yml down"
echo "      docker-compose -f docker-compose.prod.yml pull"
echo "      docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "✅ Done!"
