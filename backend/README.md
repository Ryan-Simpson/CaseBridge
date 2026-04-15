# CaseBridge Backend

FastAPI + LangGraph agent pipeline for the CaseBridge v2 wizard. Runs against
a local Ollama instance (Gemma 4 E4B) with no cloud dependencies.

## Setup

```bash
# 1. Install Ollama (https://ollama.com/download) and pull the model
./scripts/bootstrap_ollama.sh

# 2. Create a venv and install deps
python -m venv .venv
source .venv/bin/activate
pip install -e .

# 3. Run the API
uvicorn main:app --reload --port 8000
```

## Endpoints

- `GET  /health`               — liveness probe
- `POST /session/start`        — returns a new session id
- `POST /intake/turn`          — streams Gemma responses (SSE, Day 2)
- `POST /profile/finalize`     — validates canonical profile (Day 2)
- `POST /eligibility/screen`   — json-logic rules evaluation (Day 3)
- `POST /packet/render`        — action cards for eligible programs (Day 3)

## Layout

- `main.py`      — FastAPI app and endpoints
- `schemas.py`   — Pydantic models (ClientProfile, RiskFlag, ProgramCandidate)
- `graph.py`     — LangGraph CaseState + graph builder
- `agents/`      — one file per agent
- `rules/`       — json-logic eligibility rules per program
- `prompts/`     — markdown prompt templates
- `research_cache/` — pre-warmed Research Agent output for the demo
