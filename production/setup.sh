#!/bin/bash
set -e

# Make paths relative to this script's location
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

# Clean start
echo "Starting clean setup..."
docker stack rm production
docker system prune -f

# Build images
echo "Building Docker images..."
docker compose -f docker-compose.prod.stack.yaml build
# Push images to registry
echo "Pushing Docker images to registry..."
docker compose -f docker-compose.prod.stack.yaml push
# Deploy stack
echo "Deploying Docker stack..."
docker stack deploy -c docker-compose.prod.stack.yaml production --prune --detach=false

echo "Waiting for deployment to complete..."
sleep 2  # Wait for services to start

# Get the names of the backend and database containers
BACKEND=$(docker ps --format "{{.Names}}" | grep django_backend_app)
DATABASE=$(docker ps --format "{{.Names}}" | grep postgres)

# Import data
echo "Importing data..."
docker cp ../assets/countries.sql $DATABASE:/countries.sql
docker exec "$DATABASE" psql -U admin -d pg4django -f countries.sql

# Run migrations
echo "Running migrations..."
docker exec "$BACKEND" python manage.py makemigrations
docker exec "$BACKEND" python manage.py migrate

# Create superuser and groups
echo "Creating superuser and groups..."
docker exec "$BACKEND" python manage.py groups

# Initialize location geometries
docker exec "$BACKEND" python manage.py initialize_location_cache

echo "Setup complete. The application is now running and ready for use."
