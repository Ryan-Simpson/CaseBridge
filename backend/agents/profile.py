"""Profile Agent — normalization pass at finalize.

Runs once when the caseworker clicks "Finish intake". Reviews the full
transcript plus the partial profile that the per-turn extractor built,
fixes any normalization gaps (state abbreviations, numeric coercion,
household_size vs household_members mismatch), and returns a fully
validated ClientProfile.

Falls back to returning the partial profile unchanged if Gemma is
unavailable — finalize should never block the wizard.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from ollama import AsyncClient

from agents._common import MODEL, OLLAMA_HOST, PROMPTS_DIR, sanitize_patch
from schemas import ClientProfile, HouseholdMember

logger = logging.getLogger(__name__)

_FINALIZE_SYSTEM = (PROMPTS_DIR / "profile_finalize.md").read_text()


def _finalize_schema() -> dict[str, Any]:
    """JSON schema mirroring ClientProfile's normalized shape."""
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "client_name": {"type": ["string", "null"]},
            "date_of_birth": {"type": ["string", "null"], "format": "date"},
            "address": {"type": ["string", "null"]},
            "city": {"type": ["string", "null"]},
            "state": {"type": ["string", "null"]},
            "zip_code": {"type": ["string", "null"]},
            "phone_number": {"type": ["string", "null"]},
            "email": {"type": ["string", "null"]},
            "household_size": {"type": ["integer", "null"], "minimum": 1},
            "household_members": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {"type": "string", "minLength": 1},
                        "age": {"type": "integer", "minimum": 0, "maximum": 120},
                        "relationship": {"type": ["string", "null"]},
                        "student": {"type": "boolean"},
                        "disability": {"type": "boolean"},
                    },
                    "required": ["name", "age"],
                },
            },
            "monthly_income": {"type": ["number", "null"]},
            "income_sources": {"type": "array", "items": {"type": "string"}},
            "monthly_rent": {"type": ["number", "null"]},
            "utility_cost": {"type": ["number", "null"]},
            "needs": {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": [
                        "food", "housing", "healthcare", "childcare",
                        "utilities", "legal", "mental_health", "employment",
                    ],
                },
            },
        },
    }


def _validated(raw: dict[str, Any]) -> ClientProfile:
    household_members = [
        HouseholdMember(**m) if isinstance(m, dict) else m
        for m in raw.get("household_members", [])
    ]
    return ClientProfile(**{**raw, "household_members": household_members})


async def run(
    turns: list[dict[str, str]],
    partial: dict[str, Any],
) -> ClientProfile:
    """Run the finalize normalization pass.

    Falls back to the partial profile unchanged if Gemma is unavailable —
    finalize should never block the wizard.
    """
    transcript = "\n".join(
        f"{t['role'].upper()}: {t['text']}"
        for t in turns
        if t.get("text")
    )

    user_prompt = (
        f"PARTIAL PROFILE:\n{json.dumps(partial, default=str, indent=2)}\n\n"
        f"FULL TRANSCRIPT:\n{transcript}\n\n"
        f"Return the cleaned ClientProfile JSON."
    )

    try:
        client = AsyncClient(host=OLLAMA_HOST)
        response = await client.chat(
            model=MODEL,
            messages=[
                {"role": "system", "content": _FINALIZE_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            format=_finalize_schema(),
            options={"temperature": 0.0},
        )
        raw = response["message"]["content"]
        cleaned = sanitize_patch(json.loads(raw))
        # Merge cleaned over partial so fields the LLM omitted stay put.
        merged = {**partial, **{k: v for k, v in cleaned.items() if v not in (None, "", [])}}
        return _validated(merged)
    except Exception as exc:
        # Never block the wizard on normalization — fall back to partial.
        logger.warning("profile finalize fallback: %s", exc)
        return _validated(partial)
