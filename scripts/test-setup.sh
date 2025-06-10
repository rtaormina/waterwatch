#!/bin/bash
set -e

# Make paths relative to this script's location
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"
cd ../
if [ -f .env ]; then
  echo "Sourcing .env file..."
  set -o allexport
  source .env
  set +o allexport
else
  echo "Error: .env file not found in the current directory."
  echo "Please ensure .env exists and contains the necessary PostgreSQL connection variables."
  exit 1
fi

echo "Setting up test environment..."

# Start test services
docker compose -f docker-compose.test.yaml down -v
docker compose -f docker-compose.test.yaml up --build -d

# Import data to test database
docker cp assets/countries_1.sql postgres:/countries_1.sql
docker cp assets/countries_2.sql postgres:/countries_2.sql
docker compose -f docker-compose.test.yaml exec postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -f countries_1.sql
docker compose -f docker-compose.test.yaml exec postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -f countries_2.sql

# Run migrations on test backend
docker compose -f docker-compose.test.yaml exec backend python manage.py makemigrations
docker compose -f docker-compose.test.yaml exec backend python manage.py migrate

# Create superuser and groups for test
docker compose -f docker-compose.test.yaml exec backend python manage.py groups

# Create test database dump
docker compose -f docker-compose.test.yaml exec -T postgres \
  pg_dump \
    -U "${POSTGRES_USER}" \
    -h "localhost" \
    -p "5432" \
    -F c \
    "${POSTGRES_DB}" \
> test_initial_state.dump

echo "Test environment setup complete."
