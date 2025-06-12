#!/bin/bash
set -e

VOLUME=$(docker volume ls -f name=waterwatch_data --format '{{.Name}}')
if [ -z "$VOLUME" ];
then
    echo "Volume does not exist, creating a new one and importing data."

    # Clean start
    docker compose down -v
    docker compose up --build -d

    # Import data
    docker cp ../assets/countries.sql postgres:/countries.sql
    docker compose exec postgres psql -U admin -d pg4django -f countries.sql

    # Run migrations
    docker compose exec backend python manage.py makemigrations
    docker compose exec backend python manage.py migrate

    # Create superuser and groups

    docker compose exec backend python manage.py groups

else
    echo "Volume already exists, skipping data import."

    # Restart
    docker compose down
    docker compose up -d

    docker compose exec backend python manage.py makemigrations
    docker compose exec backend python manage.py migrate

    docker compose down
    docker compose up
fi
