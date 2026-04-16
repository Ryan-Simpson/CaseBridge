#!/usr/bin/env bash
# Start the full CaseBridge dev stack: Ollama check, backend, frontend.
# Usage: ./scripts/dev.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}CaseBridge dev stack${NC}"
echo "---"

# Check Ollama
if ! curl -sS --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo -e "${YELLOW}Ollama is not running. Start it with: ollama serve${NC}"
    exit 1
fi

MODEL="${CASEBRIDGE_MODEL:-gemma4:e4b}"
if ! curl -sS http://127.0.0.1:11434/api/tags 2>/dev/null | grep -q "$MODEL"; then
    echo -e "${YELLOW}Model $MODEL not found. Pull it with: ollama pull $MODEL${NC}"
    exit 1
fi
echo -e "Ollama: ${GREEN}$MODEL ready${NC}"

# Backend
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "Backend already running on :8000"
else
    echo "Starting backend on :8000..."
    cd "$(dirname "$0")/../backend"
    .venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --log-level warning &
    BACKEND_PID=$!
    cd - >/dev/null
    sleep 1
    if curl -sS http://127.0.0.1:8000/health >/dev/null 2>&1; then
        echo -e "Backend: ${GREEN}http://127.0.0.1:8000${NC} (PID $BACKEND_PID)"
    else
        echo -e "${YELLOW}Backend failed to start${NC}"
        exit 1
    fi
fi

# Frontend
if lsof -ti:5173 >/dev/null 2>&1; then
    echo "Frontend already running on :5173"
else
    echo "Starting frontend on :5173..."
    cd "$(dirname "$0")/.."
    npm run dev -- --host 127.0.0.1 --port 5173 &
    FRONTEND_PID=$!
    cd - >/dev/null
    sleep 2
    echo -e "Frontend: ${GREEN}http://127.0.0.1:5173${NC} (PID $FRONTEND_PID)"
fi

echo "---"
echo -e "${GREEN}Ready.${NC} Open http://127.0.0.1:5173"
echo "Press Ctrl+C to stop all processes."

wait
