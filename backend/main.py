from __future__ import annotations

import json
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents import intake as intake_agent
from schemas import ClientProfile, EligibilityResult

app = FastAPI(title="CaseBridge Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store — demo only, one process.
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
    SESSIONS[session_id] = {
        "turns": [],
        "profile": ClientProfile().model_dump(mode="json"),
    }
    return SessionStartResponse(session_id=session_id)


@app.post("/intake/turn")
async def intake_turn(req: IntakeTurnRequest) -> StreamingResponse:
    session = SESSIONS.get(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Unknown session")

    # Record the user turn before running the agent.
    session["turns"].append({"role": "user", "text": req.user_text})

    async def event_stream():
        assistant_text = ""
        async for event in intake_agent.run(
            turns=session["turns"],
            profile=session["profile"],
            user_text=req.user_text,
        ):
            if event["type"] == "delta":
                assistant_text += event["text"]
            elif event["type"] == "profile":
                session["profile"] = event["profile"]
            yield f"data: {json.dumps(event)}\n\n"

        session["turns"].append({"role": "assistant", "text": assistant_text})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/profile/finalize", response_model=ClientProfile)
def profile_finalize(req: FinalizeRequest) -> ClientProfile:
    session = SESSIONS.get(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Unknown session")
    # Day 2 Path B: the session profile is already merged; just return it.
    # Day 2 Path A will run a Profile Agent normalization pass here.
    return ClientProfile(**session["profile"])


@app.post("/eligibility/screen", response_model=list[EligibilityResult])
def eligibility_screen(req: EligibilityRequest) -> list[EligibilityResult]:
    # Day 3 will load json-logic rules and evaluate against req.profile.
    return []


@app.post("/packet/render")
def packet_render(req: PacketRequest) -> dict[str, list]:
    # Day 3 runs pdf-lib on the frontend; backend returns action cards only.
    return {"action_cards": []}
