# CaseBridge

**CPP AI Hackathon 2026 · Category 5 · SDGs 1, 3, 10, 11**

## Problem

Social workers spend **60–70% of their time** on administrative tasks — writing case notes, searching for resources, and filling out referral forms. This leaves less time for the people who need them most.

## Solution

CaseBridge is an AI-powered intake-to-application pipeline that runs **entirely on a local GPU** — no client data ever leaves the machine. One conversational interview captures everything a caseworker needs, then the system screens eligibility against real program rules, generates pre-filled application PDFs, and hands control back to the caseworker for review and submission.

### How it works

1. **Intake Agent** — Gemma 4 E4B conducts a warm, structured interview (supports 140+ languages). Walks through 15 required fields one at a time; extracts structured data via schema-constrained JSON.
2. **Profile Agent** — normalizes the raw interview into a validated `ClientProfile` (state abbreviations, date formatting, numeric coercion).
3. **Risk Agent** — scans the transcript for red/amber safety flags (housing crisis, child safety, medical urgency) so caseworkers catch risks before they act on referrals.
4. **Eligibility Agent** — evaluates the profile against 5 California benefit programs using deterministic json-logic rules seeded from public eligibility criteria. No LLM arithmetic — pure code.
5. **Packet Agent** — for each eligible program, generates a pre-filled AcroForm PDF application and an action card (submission URL, required documents, deadline).

### Programs supported

| Program | Agency | Rule basis |
|---|---|---|
| CalFresh (SNAP) | CA Dept. of Social Services | 130% FPL by household size |
| Emergency Rental Assistance | CA Business/Housing Agency | 80% AMI, rent burden > 40% |
| WIC | CA Dept. of Public Health | Child under 5, 185% FPL |
| LIHEAP Energy Assistance | CA Dept. of Community Services | Utility cost + 150% FPL |
| Free & Reduced School Meals | CA Dept. of Education | School-age child, 185% FPL |

## Tech Stack

- **Frontend:** React 19 + Vite 8 + Tailwind CSS v4
- **AI:** Gemma 4 E4B via Ollama (local inference, Apache 2.0)
- **Backend:** FastAPI + LangGraph + Pydantic
- **PDF:** pdf-lib (client-side summary) + reportlab/pypdf (AcroForm templates)
- **Rules:** json-logic-qubit (deterministic eligibility)
- **Fonts:** DM Sans + Source Serif 4

## Setup

### Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **Ollama** with `gemma4:e4b` pulled
- **NVIDIA GPU** with 10+ GB VRAM (tested on RTX 5070 Ti 16 GB)

### Quick start

```bash
# 1. Clone
git clone https://github.com/Ryan-Simpson/CaseBridge.git
cd CaseBridge

# 2. Frontend
npm install

# 3. Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/build_templates.py   # generates AcroForm PDF templates

# 4. Ollama (if not already running)
ollama pull gemma4:e4b

# 5. Start everything
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && .venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000

# 6. Open http://localhost:5173
```

### Environment variables (optional)

```bash
VITE_BACKEND_URL=http://localhost:8000   # frontend → backend
CASEBRIDGE_MODEL=gemma4:e4b              # Ollama model name
OLLAMA_HOST=http://127.0.0.1:11434      # Ollama server
```

## SDGs Addressed

- **SDG 1** — No Poverty (eligibility screening for financial assistance)
- **SDG 3** — Good Health and Well-Being (WIC, healthcare referrals)
- **SDG 10** — Reduced Inequalities (140+ language support, equitable access)
- **SDG 11** — Sustainable Cities and Communities (connecting people to local resources)

## Privacy

All AI inference runs on the local GPU via Ollama. No client data is sent to any cloud service. The entire pipeline works with the network disconnected.

---

*Demo only — no real client data is collected or stored.*
