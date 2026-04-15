from __future__ import annotations

import json
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents import eligibility as eligibility_agent
from agents import intake as intake_agent
from agents import packet as packet_agent
from agents import pdf_filler
from agents import profile as profile_agent
from agents import risk as risk_agent
from schemas import ActionCard, ClientProfile, EligibilityResult

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


class LanguageRequest(BaseModel):
    session_id: str
    language: str


class EligibilityRequest(BaseModel):
    profile: ClientProfile


class PacketRequest(BaseModel):
    profile: ClientProfile
    program_ids: list[str]


class FillFormRequest(BaseModel):
    profile: ClientProfile
    program_id: str


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


@app.post("/session/language")
def set_language(req: LanguageRequest) -> dict[str, str]:
    session = SESSIONS.get(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Unknown session")
    language = req.language.strip()
    if not language or len(language) > 64:
        raise HTTPException(status_code=400, detail="Language must be 1–64 characters")
    session["profile"]["preferred_language"] = language
    return {"language": language}


@app.post("/profile/finalize", response_model=ClientProfile)
async def profile_finalize(req: FinalizeRequest) -> ClientProfile:
    session = SESSIONS.get(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Unknown session")

    normalized = await profile_agent.run(
        turns=session["turns"],
        partial=session["profile"],
    )
    risk_flags = await risk_agent.run(turns=session["turns"])
    normalized.risk_flags = risk_flags
    session["profile"] = normalized.model_dump(mode="json")
    return normalized


@app.post("/eligibility/screen", response_model=list[EligibilityResult])
def eligibility_screen(req: EligibilityRequest) -> list[EligibilityResult]:
    return eligibility_agent.run(req.profile)


@app.post("/packet/render", response_model=list[ActionCard])
def packet_render(req: PacketRequest) -> list[ActionCard]:
    # PDF rendering runs client-side via pdf-lib. Backend returns
    # action cards for each eligible program so the frontend can pair
    # them with its rendered PDF.
    results = eligibility_agent.run(req.profile)
    if req.program_ids:
        results = [r for r in results if r.program_id in req.program_ids]
    return packet_agent.run(req.profile, results)


@app.post("/packet/fill-form")
def packet_fill_form(req: FillFormRequest) -> Response:
    """Fill a deterministic AcroForm PDF template for the requested program.

    Takes a ClientProfile and program_id, loads the pre-built template
    from backend/forms/{program_id}.pdf, populates its AcroForm fields
    via a static field map, and returns the bytes as application/pdf.
    """
    pdf_bytes = pdf_filler.run(req.profile, req.program_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{req.program_id}-application.pdf"',
        },
    )
