#!/usr/bin/env bash
# Bootstrap Ollama with the Intake model for CaseBridge.
# Gemma 4 E4B is the production target; gemma3:4b is a temporary placeholder
# until Gemma 4 E4B publishes to the Ollama registry.

set -euo pipefail

if ! command -v ollama >/dev/null 2>&1; then
    echo "Ollama not installed. Install from https://ollama.com/download" >&2
    exit 1
fi

MODEL="${CASEBRIDGE_MODEL:-gemma3:4b}"

echo "Pulling $MODEL..."
ollama pull "$MODEL"

echo "Warming model with a smoke test..."
ollama run "$MODEL" "Say 'ready' in one word." --nowordwrap

echo "Bootstrap complete. Model: $MODEL"
