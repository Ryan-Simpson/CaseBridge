"""Packet Agent — produces action cards for eligible programs.

Backend returns action_cards only. PDF rendering runs client-side via pdf-lib
so we don't ship PDF bytes through the API.
"""

from __future__ import annotations

from schemas import ActionCard, ClientProfile, EligibilityResult


def run(
    profile: ClientProfile,
    eligibility: list[EligibilityResult],
) -> list[ActionCard]:
    raise NotImplementedError("Day 3")
