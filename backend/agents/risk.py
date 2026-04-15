"""Risk Agent — classifies red/amber flags over a transcript window.

Runs in parallel with Intake, after every 2 user turns. Replaces the deleted
keyword-based src/lib/risk-detection.js with a Gemma classifier prompt.
"""

from __future__ import annotations

from schemas import RiskFlag


async def run(turns: list[dict[str, str]]) -> list[RiskFlag]:
    raise NotImplementedError("Day 3")
