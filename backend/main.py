from __future__ import annotations

import uuid
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from schemas import ClientProfile, EligibilityResult

app = FastAPI(title="CaseBridge Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store — demo only, one process
SESSIONS: dict[str, dict[str, Any]] = {}


class SessionStartResponse(BaseModel):
    session_id: str


class IntakeTurnRequest(BaseModel):
    session_id: str
    user_text: str


class FinalizeRequest(BaseModel):
    session_id: str


class EligibilityRequest(BaseModel):
    profile: ClientProfile


class PacketRequest(BaseModel):
    profile: ClientProfile
    program_ids: list[str]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/session/start", response_model=SessionStartResponse)
def session_start() -> SessionStartResponse:
    session_id = uuid.uuid4().hex
    SESSIONS[session_id] = {"turns": [], "profile": ClientProfile().model_dump(mode="json")}
    return SessionStartResponse(session_id=session_id)


@app.post("/intake/turn")
def intake_turn(req: IntakeTurnRequest) -> dict[str, str]:
    # Day 2 will replace this with an SSE stream from the Intake Agent.
    return {"status": "not_implemented"}


@app.post("/profile/finalize", response_model=ClientProfile)
def profile_finalize(req: FinalizeRequest) -> ClientProfile:
    # Day 2 will run the Profile Agent here.
    return ClientProfile()


@app.post("/eligibility/screen", response_model=list[EligibilityResult])
def eligibility_screen(req: EligibilityRequest) -> list[EligibilityResult]:
    # Day 3 will load json-logic rules and evaluate against req.profile.
    return []


@app.post("/packet/render")
def packet_render(req: PacketRequest) -> dict[str, list]:
    # Day 3 runs pdf-lib on the frontend; backend returns action cards only.
    return {"action_cards": []}
