#!/bin/bash

# Exit on first error
set -e

echo "⚖️ Starting Legal AI Gateway Production System..."

# Check if Docker is running
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Ollama is running on host
echo "Checking if Ollama is running on the host system (http://127.0.0.1:11434)..."
if curl -s -f http://127.0.0.1:11434 > /dev/null 2>&1; then
    echo "✅ Ollama is running on host."
    # Check if qwen2.5:7b is pulled
    if curl -s http://127.0.0.1:11434/api/tags | grep -q "qwen2.5:7b"; then
        echo "✅ Model 'qwen2.5:7b' is already pulled."
    else
        echo "📥 Model 'qwen2.5:7b' is missing. Pulling it automatically..."
        if command -v ollama >/dev/null 2>&1; then
            ollama pull qwen2.5:7b
        else
            echo "Ollama CLI not found in PATH. Pulling via local API..."
            curl -X POST http://127.0.0.1:11434/api/pull -d '{"name": "qwen2.5:7b"}'
        fi
    fi
else
    echo "⚠️ Warning: Ollama does not seem to be running on http://127.0.0.1:11434."
    echo "   Make sure 'ollama serve' is running and 'qwen2.5:7b' model is pulled."
    echo "   Otherwise, the legal assistant will return error messages during chat."
    echo ""
    read -p "Do you want to continue launching the containers anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Startup cancelled."
        exit 1
    fi
fi

# Determine command to use (docker compose vs docker-compose)
COMPOSE_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
    if docker-compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
    else
        echo "❌ Error: Neither 'docker compose' nor 'docker-compose' is installed."
        exit 1
    fi
fi

echo "🚀 Safely stopping and rebuilding app containers..."

# 1. Bring down what we can via compose (NO -v flag, so data is 100% safe)
$COMPOSE_CMD down --remove-orphans

# 2. Safely STOP the database container if it's running outside this compose project context
# This prevents the name conflict without deleting the container or its data.
if docker ps --format '{{.Names}}' | grep -qx "legal_ai_db"; then
    echo "🛑 Stopping active database container to avoid conflicts..."
    docker stop "legal_ai_db"
fi

# 3. Force-remove only the stale application containers if they got left behind
for container in legal_ai_redis legal_ai_backend legal_ai_frontend; do
    if docker ps -a --format '{{.Names}}' | grep -qx "$container"; then
        echo "🧹 Removing stale app container: $container"
        docker rm -f "$container"
    fi
done

# 4. Start everything up. Compose will restart legal_ai_db safely with your data intact.
$COMPOSE_CMD up --build