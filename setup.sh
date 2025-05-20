#!/bin/bash
# set -e

# # Clean start
docker compose down -v
docker compose up --build -d
# docker compose up -d

# # Import data
docker cp countries_1.sql postgres:/countries_1.sql
docker cp countries_2.sql postgres:/countries_2.sql
docker compose exec postgres psql -U admin -d pg4django -f countries_1.sql
docker compose exec postgres psql -U admin -d pg4django -f countries_2.sql

# # Run migrations
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# Create superuser and groups

docker compose exec backend python groups.py

# docker compose down
# docker compose up -d
