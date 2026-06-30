#!/bin/bash

# Exit on first error
set -e

echo "Starting Legal AI Gateway Production System..."

# Check if Docker is running
if ! docker ps >/dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Determine command to use (docker compose vs docker-compose)
COMPOSE_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
    if docker-compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
    else
        echo "Error: Neither 'docker compose' nor 'docker-compose' is installed."
        exit 1
    fi
fi

echo "Safely stopping and rebuilding app containers..."

# 1. Bring down what we can via compose (NO -v flag, so data is 100% safe)
$COMPOSE_CMD down --remove-orphans

# 2. Safely STOP the database container if it's running outside this compose project context
# This prevents the name conflict without deleting the container or its data.
for db_container in legal_ai_db legal_assistant_db; do
    if docker ps --format '{{.Names}}' | grep -qx "$db_container"; then
        echo "Stopping active database container: $db_container to avoid conflicts..."
        docker stop "$db_container"
    fi
done

# 3. Force-remove only the stale application containers if they got left behind
for container in legal_ai_redis legal_ai_backend legal_ai_frontend legal_assistant_redis legal_assistant_backend legal_assistant_frontend; do
    if docker ps -a --format '{{.Names}}' | grep -qx "$container"; then
        echo "Removing stale app container: $container"
        docker rm -f "$container"
    fi
done

# 4. Start everything up. Compose will restart legal_ai_db safely with your data intact.
$COMPOSE_CMD up --build