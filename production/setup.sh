#!/bin/bash
set -e

# Make paths relative to this script's location
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

# Clean start
echo "Starting clean setup..."
docker compose -f docker-compose.prod.yaml down -v
docker compose -f docker-compose.prod.yaml up --build -d

# Import data
echo "Importing data..."
docker cp ../countries_1.sql postgres:/countries_1.sql
docker cp ../countries_2.sql postgres:/countries_2.sql
docker compose -f docker-compose.prod.yaml exec postgres psql -U admin -d pg4django -f countries_1.sql
docker compose -f docker-compose.prod.yaml exec postgres psql -U admin -d pg4django -f countries_2.sql

# Run migrations
echo "Running migrations..."
docker compose -f docker-compose.prod.yaml exec django_backend_app python manage.py makemigrations
docker compose -f docker-compose.prod.yaml exec django_backend_app python manage.py migrate

# Create superuser and groups
echo "Creating superuser and groups..."
docker compose -f docker-compose.prod.yaml exec django_backend_app python manage.py groups

echo "Setup complete. The application is now running and ready for use."
