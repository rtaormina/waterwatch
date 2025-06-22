#!/bin/bash
set -e

# Make paths relative to this script's location
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

# Build images
echo "Building Docker images..."
docker compose -f docker-compose.prod.stack.yaml build

# Push images to registry
echo "Pushing Docker images to registry..."
docker compose -f docker-compose.prod.stack.yaml push

# Deploy stack
echo "Deploying Docker stack..."
export $(grep -v '^#' .env | xargs) && docker stack config -c docker-compose.prod.stack.yaml | docker stack deploy -c - production --prune --detach=false

# Wait for deployment to complete
echo "Waiting for deployment to complete..."

sleep 2  # Wait for services to start

# Apply database migrations
BACKEND=$(docker ps --format "{{.Names}}" | grep django_backend_app)
docker exec "$BACKEND" python manage.py migrate

echo "Deployment completed successfully!"
