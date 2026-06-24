#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════╗"
echo "║       ForkFlow Setup                 ║"
echo "╚══════════════════════════════════════╝"
echo ""

# --- Check dependencies ---
echo "▶ Checking dependencies..."

if ! command -v python3 &>/dev/null; then
  echo "✗ Python 3.11+ not found. Install: https://www.python.org/downloads/"
  exit 1
fi

PY_VERSION=$(python3 -c 'import sys; print(sys.version_info[:2])')
if [ "$PY_VERSION" = "(3, 0)" ] || [ "$PY_VERSION" = "(3, 1)" ] || [ "$PY_VERSION" = "(3, 2)" ] || \
   [ "$PY_VERSION" = "(3, 3)" ] || [ "$PY_VERSION" = "(3, 4)" ] || [ "$PY_VERSION" = "(3, 5)" ] || \
   [ "$PY_VERSION" = "(3, 6)" ] || [ "$PY_VERSION" = "(3, 7)" ] || [ "$PY_VERSION" = "(3, 8)" ] || \
   [ "$PY_VERSION" = "(3, 9)" ] || [ "$PY_VERSION" = "(3, 10)" ]; then
  echo "✗ Python 3.11+ required. Found: $(python3 --version)"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "✗ Node.js 20+ not found. Install: https://nodejs.org/"
  exit 1
fi

NODE_MAJOR=$(node -e 'console.log(process.versions.node.split(".")[0])')
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "✗ Node.js 20+ required. Found: $(node --version)"
  exit 1
fi

echo "  ✓ Python $(python3 --version 2>&1 | awk '{print $2}')"
echo "  ✓ Node $(node --version)"
echo ""

# --- Environment file ---
if [ ! -f .env ]; then
  cp .env.example .env
  echo "▶ Created .env from .env.example (edit if needed)"
else
  echo "▶ .env already exists, skipping"
fi
echo ""

# --- Backend ---
echo "▶ Setting up backend..."
cd backend

if [ ! -d .venv ]; then
  python3 -m venv .venv
  echo "  ✓ Virtual environment created"
fi

source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo "  ✓ Dependencies installed"

cd ..
echo ""

# --- Frontend ---
echo "▶ Setting up frontend..."
cd frontend

if [ ! -d node_modules ]; then
  npm install --silent
  echo "  ✓ npm install complete"
else
  echo "  ✓ node_modules exists, skipping install"
fi

npm run build
echo "  ✓ Frontend built → dist/"

cd ..
echo ""

# --- Done ---
echo "╔══════════════════════════════════════╗"
echo "║  ✓ Setup complete!                  ║"
echo "║                                      ║"
echo "║  Run:  ./start.sh                    ║"
echo "║  Open: http://localhost:8000         ║"
echo "╚══════════════════════════════════════╝"
