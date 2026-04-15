"""LangGraph state graph wiring the 5-agent pipeline.

Day 1: skeleton only — nodes are stubs that return untouched state.
Day 2: intake + profile get real implementations.
Day 3: risk + eligibility + packet wire up.
Day 4: research agent cache mode.
"""

from __future__ import annotations

from typing import TypedDict

from schemas import ClientProfile, EligibilityResult, ProgramCandidate, RiskFlag


class CaseState(TypedDict, total=False):
    session_id: str
    turns: list[dict]
    profile: ClientProfile
    risk_flags: list[RiskFlag]
    candidates: list[ProgramCandidate]
    eligibility: list[EligibilityResult]


def build_graph():
    """Return a compiled LangGraph once agents are implemented."""
    return None
