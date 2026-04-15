"""Packet Agent — produces action cards for eligible programs.

Pure Python: looks up each eligible program's rule metadata (submission
URL, required docs, deadline) and returns an ActionCard. PDF rendering
runs client-side via pdf-lib, so this agent never produces PDF bytes.
"""

from __future__ import annotations

from agents.eligibility import RULES_BY_ID
from schemas import ActionCard, ClientProfile, EligibilityResult


def run(
    profile: ClientProfile,
    eligibility_results: list[EligibilityResult],
) -> list[ActionCard]:
    cards: list[ActionCard] = []
    for result in eligibility_results:
        if not result.eligible:
            continue
        rule = RULES_BY_ID.get(result.program_id)
        if rule is None:
            continue
        cards.append(
            ActionCard(
                program_id=result.program_id,
                submission_url=rule.get("submission_url"),
                docs_needed=rule.get("required_docs", []),
                deadline=rule.get("deadline"),
                notes=rule.get("description"),
            )
        )
    return cards
