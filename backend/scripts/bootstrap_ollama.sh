#!/usr/bin/env bash
# Bootstrap Ollama with the Intake model for CaseBridge.
# Default model is Gemma 4 E4B (edge variant, 9.6 GB). Fits 16 GB GPUs
# comfortably with 128K context and multimodal input support.

set -euo pipefail

if ! command -v ollama >/dev/null 2>&1; then
    echo "Ollama not installed. Install from https://ollama.com/download" >&2
    exit 1
fi

MODEL="${CASEBRIDGE_MODEL:-gemma4:e4b}"

echo "Pulling $MODEL..."
ollama pull "$MODEL"

echo "Warming model with a smoke test..."
ollama run "$MODEL" "Say 'ready' in one word." --nowordwrap

echo "Bootstrap complete. Model: $MODEL"
