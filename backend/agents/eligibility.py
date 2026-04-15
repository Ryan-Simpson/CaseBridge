"""Eligibility Agent — deterministic json-logic rules evaluation.

Loads rules/<program>.json and evaluates against a ClientProfile.
Not an LLM. The LLM only writes rules offline during dev; at runtime, rules
are pure code.
"""

from __future__ import annotations

from schemas import ClientProfile, EligibilityResult, ProgramCandidate


def run(
    profile: ClientProfile,
    candidates: list[ProgramCandidate],
) -> list[EligibilityResult]:
    raise NotImplementedError("Day 3")
