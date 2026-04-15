"""Intake Agent — conversational interview.

Day 2 Path B: deterministic mock. Returns scripted responses token-by-token
so the SSE streaming pipeline can be built and verified without a live
Ollama dependency. Day 2 Path A (follow-up commit) replaces the script with
real Gemma streaming via the ollama Python client.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from typing import Any

from schemas import ClientProfile, HouseholdMember


# Shown to the user when the chat opens — no API call involved.
OPENING_MESSAGE = (
    "Hi, I'm here to help you capture this intake quickly. Can you tell me "
    "the client's name and a sentence or two about what brought them in today?"
)

# Responses to user turns. INTAKE_SCRIPT[0] is the reply to the first user
# message, [1] to the second, etc.
INTAKE_SCRIPT: list[dict[str, Any]] = [
    {
        "response": (
            "Thank you for sharing that. To check eligibility for school-linked "
            "programs, could you share the children's names and ages?"
        ),
        "profile_patch": {
            "client_name": "Maria Santos",
            "needs": ["housing", "food", "employment"],
            "household_size": 3,
            "preferred_language": "en",
        },
    },
    {
        "response": (
            "Got it. Now, what is the household's current monthly income — "
            "including any unemployment benefits or other sources?"
        ),
        "profile_patch": {
            "household_members": [
                {"name": "Sofia Santos", "age": 8, "relationship": "daughter", "student": True},
                {"name": "Diego Santos", "age": 6, "relationship": "son", "student": True},
            ],
        },
    },
    {
        "response": (
            "Thanks. What city and state is the household in? This determines "
            "which local programs apply."
        ),
        "profile_patch": {
            "monthly_income": "1200",
            "income_sources": ["Unemployment Insurance"],
            "monthly_rent": "1450",
        },
    },
    {
        "response": (
            "Perfect — that's enough for a first pass. I've captured the key "
            "facts. Click 'Finish intake' to review the profile and screen "
            "for eligible programs."
        ),
        "profile_patch": {
            "city": "Los Angeles",
            "state": "CA",
        },
    },
]


DEFAULT_DONE_RESPONSE = (
    "I already have the key facts for this intake. Click 'Finish intake' "
    "to continue to the profile review."
)


def _merge_profile(current: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    """Merge a flat patch into the current profile dict. Lists replace."""
    merged = dict(current)
    for key, value in patch.items():
        if value is None:
            continue
        merged[key] = value
    return merged


def _validated_profile(raw: dict[str, Any]) -> dict[str, Any]:
    """Round-trip through ClientProfile to get JSON-safe output."""
    household_members = [
        HouseholdMember(**m) for m in raw.get("household_members", [])
    ]
    profile = ClientProfile(**{**raw, "household_members": household_members})
    return profile.model_dump(mode="json")


async def run(
    turns: list[dict[str, str]],
    profile: dict[str, Any],
    user_text: str,
) -> AsyncIterator[dict[str, Any]]:
    """Stream assistant deltas and profile patches for a single user turn.

    Yields SSE-shaped dicts consumed by main.intake_turn:
      {type: 'delta',   text: str}
      {type: 'profile', profile: dict}
      {type: 'done'}
    """
    # `turns` already includes the current user turn appended by main.py,
    # so user_turn_count is this turn's 1-indexed position.
    user_turn_count = sum(1 for t in turns if t.get("role") == "user")
    idx = user_turn_count - 1

    if 0 <= idx < len(INTAKE_SCRIPT):
        script = INTAKE_SCRIPT[idx]
        response_text = script["response"]
        patch = script["profile_patch"]
    else:
        response_text = DEFAULT_DONE_RESPONSE
        patch = {}

    # Stream the response word-by-word so the frontend sees real tokens.
    for word in response_text.split(" "):
        yield {"type": "delta", "text": word + " "}
        await asyncio.sleep(0.03)

    # Merge and emit the updated profile (if any new facts).
    if patch:
        merged = _merge_profile(profile, patch)
        yield {"type": "profile", "profile": _validated_profile(merged)}

    yield {"type": "done"}
