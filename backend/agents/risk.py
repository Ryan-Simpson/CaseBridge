"""Risk Agent — classifies red/amber safety flags over an intake transcript.

Runs once at finalize time on the full conversation. Returns a list of
RiskFlag entries the caseworker should review before acting on the
profile. Defaults to an empty list on any LLM failure — risk scanning
should never block the wizard.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from ollama import AsyncClient

from agents._common import MODEL, OLLAMA_HOST, PROMPTS_DIR
from schemas import RiskFlag

logger = logging.getLogger(__name__)

_RISK_SYSTEM = (PROMPTS_DIR / "risk_scan.md").read_text()

_VALID_SEVERITIES = {"red", "amber"}
_VALID_CATEGORIES = {
    "housing", "food", "child_safety", "elder_safety", "mental_health",
    "domestic_violence", "substance_use", "medical", "financial", "legal",
    "other",
}


def _risk_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "flags": {
                "type": "array",
                "maxItems": 5,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "severity": {"type": "string", "enum": sorted(_VALID_SEVERITIES)},
                        "category": {"type": "string", "enum": sorted(_VALID_CATEGORIES)},
                        "reason": {"type": "string", "minLength": 1, "maxLength": 240},
                    },
                    "required": ["severity", "category", "reason"],
                },
            },
        },
        "required": ["flags"],
    }


def _validate_flags(raw: list[dict[str, Any]]) -> list[RiskFlag]:
    flags: list[RiskFlag] = []
    for entry in raw:
        severity = entry.get("severity")
        category = entry.get("category")
        reason = entry.get("reason")
        if severity not in _VALID_SEVERITIES:
            continue
        if category not in _VALID_CATEGORIES:
            continue
        if not reason:
            continue
        flags.append(RiskFlag(severity=severity, category=category, reason=reason))
    return flags


async def run(turns: list[dict[str, str]]) -> list[RiskFlag]:
    """Return a list of risk flags for the given transcript. Falls back to
    empty on Gemma failure."""
    transcript = "\n".join(
        f"{t['role'].upper()}: {t['text']}"
        for t in turns
        if t.get("text")
    )
    if not transcript.strip():
        return []

    try:
        client = AsyncClient(host=OLLAMA_HOST)
        response = await client.chat(
            model=MODEL,
            messages=[
                {"role": "system", "content": _RISK_SYSTEM},
                {"role": "user", "content": transcript},
            ],
            format=_risk_schema(),
            options={"temperature": 0.0},
        )
        raw = json.loads(response["message"]["content"])
        return _validate_flags(raw.get("flags", []))
    except Exception as exc:
        logger.warning("risk scan fallback: %s", exc)
        return []
