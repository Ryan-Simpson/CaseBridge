"""Shared helpers for the agent modules.

Holds the configuration constants, placeholder-detection logic, and
schema-drift sanitization that both the Intake Agent and Profile Agent
use. Keeps `intake.py` and `profile.py` free of duplicate code.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

MODEL = os.environ.get("CASEBRIDGE_MODEL", "gemma4:e4b")
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


# Names the model sometimes invents when it has "two kids" but no real
# names to fill in. We strip these during sanitization.
_PLACEHOLDER_NAME_PATTERNS = (
    "kid ", "kid1", "kid2", "kid3",
    "child ", "child1", "child2", "child3",
    "placeholder", "tbd", "unknown", "n/a", "na",
)


def is_placeholder_member(member: dict[str, Any]) -> bool:
    """Return True if a household_members entry looks hallucinated.

    Placeholder entries come from two failure modes: the model inventing
    a name like "Kid 1" when none was given, or setting `age` to 0 as a
    sentinel when the caseworker didn't state an age.
    """
    name = str(member.get("name", "")).strip().lower()
    if not name:
        return True
    for pattern in _PLACEHOLDER_NAME_PATTERNS:
        if name.startswith(pattern) or name == pattern.strip():
            return True
    age = member.get("age")
    if age in (None, 0):
        return True
    return False


def sanitize_patch(patch: dict[str, Any]) -> dict[str, Any]:
    """Defensive cleanup applied after every LLM extraction.

    Sits on top of the schema's `additionalProperties: false` as a
    belt-and-suspenders layer for two specific failure modes:

    1. The model emits `name` at the top level instead of `client_name`.
       We remap the value if `client_name` is missing; otherwise we drop
       the stray key.
    2. The model invents placeholder `household_members` entries. We
       drop any that match `is_placeholder_member`.
    """
    cleaned = dict(patch)

    if "name" in cleaned and "client_name" not in cleaned:
        cleaned["client_name"] = cleaned.pop("name")
    else:
        cleaned.pop("name", None)

    members = cleaned.get("household_members")
    if isinstance(members, list):
        real_members = [m for m in members if not is_placeholder_member(m)]
        if real_members:
            cleaned["household_members"] = real_members
        else:
            cleaned.pop("household_members", None)

    return cleaned
