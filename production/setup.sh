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

# Apply PostgreSQL configurations
echo "Applying PostgreSQL configuration..."
docker exec "$DATABASE" psql -U admin -d pg4django -c "ALTER SYSTEM SET max_connections = '${POSTGRES_MAX_CONNECTIONS}';"
docker exec "$DATABASE" psql -U admin -d pg4django -c "ALTER SYSTEM SET idle_in_transaction_session_timeout = '${POSTGRES_IDLE_IN_TRANSACTION_SESSION_TIMEOUT}';"
docker exec "$DATABASE" psql -U admin -d pg4django -c "ALTER SYSTEM SET statement_timeout = '${POSTGRES_STATEMENT_TIMEOUT}';"
docker exec "$DATABASE" psql -U admin -d pg4django -c "ALTER SYSTEM SET tcp_keepalives_idle = '${POSTGRES_TCP_KEEPALIVES_IDLE}';"
docker exec "$DATABASE" psql -U admin -d pg4django -c "ALTER SYSTEM SET work_mem = '${POSTGRES_WORK_MEM}';"
docker exec "$DATABASE" psql -U admin -d pg4django -c "ALTER SYSTEM SET maintenance_work_mem = '${POSTGRES_MAINTENANCE_WORK_MEM}';"
docker exec "$DATABASE" psql -U admin -d pg4django -c "ALTER SYSTEM SET effective_cache_size = '${POSTGRES_EFFECTIVE_CACHE_SIZE}';"

# Reload PostgreSQL to apply the new settings
echo "Reloading PostgreSQL configuration..."
docker exec "${DATABASE}" runuser -u postgres -- pg_ctl reload

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
