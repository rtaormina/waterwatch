#!/bin/bash
set -e

# Make paths relative to this script's location
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"
cd ../

if [ -f .env ]; then
  echo "[DB Reset] Sourcing .env file..."
  set -o allexport
  source .env
  set +o allexport
else
  echo "[DB Reset] Error: .env file not found in the current directory."
  echo "[DB Reset] Please ensure .env exists and contains the necessary PostgreSQL connection variables."
  exit 1
fi

echo "[DB Reset] Preparing services for database reset..."

# Stop backend first to prevent any interference.
# Ignore errors if it's not running.
docker compose -f docker-compose.test.yaml stop backend || echo "[DB Reset] backend was not running or could not be stopped (this is likely fine)."

# Ensure postgres is up (or start it). This initial 'up' might be from a previous state.
docker compose -f docker-compose.test.yaml up -d postgres

echo "[DB Reset] Resetting test database by stopping and restarting postgres (tmpfs will ensure a clean state)..."
docker compose -f docker-compose.test.yaml stop postgres
# 'up -d' will recreate and start the container.
# Since /var/lib/postgresql/data is tmpfs, it will be completely empty.
docker compose -f docker-compose.test.yaml up -d postgres

echo "[DB Reset] Waiting for PostgreSQL server in postgres to become ready..."
MAX_RETRIES=12
RETRY_INTERVAL=5 # seconds
RETRY_COUNT=0
DB_SERVER_READY=false
until [ "$DB_SERVER_READY" = true ] || [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; do
  # pg_isready -q (quiet) exits 0 if ready, 1 if not accepting connections, 2 if no response, 3 if rejected
  if docker compose -f docker-compose.test.yaml exec -T postgres pg_isready -U "${POSTGRES_USER}" -q; then
    DB_SERVER_READY=true
    echo "[DB Reset] PostgreSQL server in postgres is ready."
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "[DB Reset] Waiting for postgres server... (attempt $RETRY_COUNT/$MAX_RETRIES, waiting ${RETRY_INTERVAL}s)"
    sleep "$RETRY_INTERVAL"
  fi
done

if [ "$DB_SERVER_READY" = false ]; then
  echo "[DB Reset] Error: PostgreSQL server in postgres did not become ready in time."
  echo "[DB Reset] Logs for postgres:"
  docker compose -f docker-compose.test.yaml logs postgres
  exit 1
fi

# The postgres container should automatically create the database `${POSTGRES_DB}`
# because it's specified in its environment variables and starts with an empty data volume (tmpfs).
# We verify this.
echo "[DB Reset] Verifying database '${POSTGRES_DB}' existence..."
DB_EXISTS_CHECK_COMMAND="SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'"
# Use -t for tuples-only (no headers), -A for unaligned (no padding)
if docker compose -f docker-compose.test.yaml exec -T postgres \
   psql -U "${POSTGRES_USER}" -d postgres -tAc "$DB_EXISTS_CHECK_COMMAND" | grep -q 1; then
  echo "[DB Reset] Database '${POSTGRES_DB}' confirmed to exist."
else
  echo "[DB Reset] Database '${POSTGRES_DB}' was NOT found automatically. This is unexpected with tmpfs."
  echo "[DB Reset] Attempting to create it manually..."
  docker compose -f docker-compose.test.yaml exec -T postgres \
    psql -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE \"${POSTGRES_DB}\";"
  echo "[DB Reset] Database '${POSTGRES_DB}' created manually."
fi

echo "[DB Reset] Restoring 'test_initial_state.dump' into '${POSTGRES_DB}'..."
if [ -f test_initial_state.dump ]; then
  cat test_initial_state.dump | \
    docker compose -f docker-compose.test.yaml exec -T postgres \
      pg_restore -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists --exit-on-error
  echo "[DB Reset] Database dump restored successfully."
else
  echo "[DB Reset] Error: test_initial_state.dump not found. Please run test-setup.sh first."
  exit 1
fi

echo "[DB Reset] Starting backend service now that the database is restored..."
# 'up -d' will create and start backend if it doesn't exist, or just start it.
docker compose -f docker-compose.test.yaml up -d backend

# Initialize geometry cache
docker compose exec backend python manage.py shell -c "from measurement_export.utils import initialize_location_geometries; initialize_location_geometries(); print('Geoms cached')"


echo "[DB Reset] Test database reset process complete."
