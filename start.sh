#!/usr/bin/env bash
set -euo pipefail

echo "▶ Starting ForkFlow..."

# Load environment
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Activate venv
source backend/.venv/bin/activate

# Set defaults
export FORKFLOW_HOST="${FORKFLOW_HOST:-0.0.0.0}"
export FORKFLOW_PORT="${FORKFLOW_PORT:-8000}"

echo "  → http://${FORKFLOW_HOST}:${FORKFLOW_PORT}"
echo "  → Press Ctrl+C to stop"
echo ""

cd backend
exec uvicorn app.main:app \
  --host "$FORKFLOW_HOST" \
  --port "$FORKFLOW_PORT"