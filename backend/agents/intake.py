"""Intake Agent — conversational interview backed by local Gemma.

Two LLM calls per user turn:

1. **Conversational response** — streams word-by-word from Gemma, using the
   intake system prompt plus the rolling chat history. This is what the
   caseworker sees in the chat bubble.

2. **Profile extraction** — after the response completes, a second
   schema-constrained call extracts any new facts from the latest user turn
   and emits them as a patch to the frontend.

Splitting extraction from conversation keeps each prompt small and lets us
use structured output (Ollama's `format=` parameter) for the extraction step
without distorting the conversational tone of the first call.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

from ollama import AsyncClient

from agents._common import MODEL, OLLAMA_HOST, PROMPTS_DIR, sanitize_patch
from schemas import ClientProfile, HouseholdMember

_INTAKE_SYSTEM = (PROMPTS_DIR / "intake_en.md").read_text()
_EXTRACT_SYSTEM = (PROMPTS_DIR / "profile_extract.md").read_text()


# Fields the intake must capture before the caseworker can finish.
# Order matters — the agent asks about them in this order, top to bottom.
# Each entry is (profile_key, short_human_label).
REQUIRED_FIELDS: list[tuple[str, str]] = [
    ("client_name", "client's full name"),
    ("date_of_birth", "client's date of birth"),
    ("household_size", "how many people live in the household"),
    ("household_members", "the names and ages of each household member"),
    ("address", "street address (with apartment or unit if applicable)"),
    ("city", "city"),
    ("state", "state"),
    ("zip_code", "ZIP code"),
    ("phone_number", "phone number"),
    ("email", "email address"),
    ("monthly_income", "total monthly income (including benefits)"),
    ("income_sources", "where the income comes from (job, unemployment, SSI, etc.)"),
    ("monthly_rent", "monthly rent or mortgage payment"),
    ("utility_cost", "approximate monthly utility cost (electric, gas, water)"),
    ("needs", "the main challenges the client is facing (food, housing, etc.)"),
]


def _compute_missing(profile: dict[str, Any]) -> list[tuple[str, str]]:
    """Compute which required fields are still unfilled. Order is significant.

    Household members has special logic: if the client lives alone
    (`household_size == 1`), an empty members list is complete, not missing.
    """
    size = profile.get("household_size")
    members = profile.get("household_members") or []

    missing: list[tuple[str, str]] = []
    for key, label in REQUIRED_FIELDS:
        if key == "household_members":
            if size is None:
                # Wait for household_size before asking about members.
                missing.append((key, label))
            elif size <= 1:
                # Client lives alone — no members to capture.
                pass
            elif len(members) < size - 1:
                missing.append((key, label))
            continue
        value = profile.get(key)
        if value in (None, "", [], {}):
            missing.append((key, label))
    return missing


def _client() -> AsyncClient:
    return AsyncClient(host=OLLAMA_HOST)


def _build_chat_messages(
    turns: list[dict[str, str]],
    profile: dict[str, Any],
) -> list[dict[str, str]]:
    """Assemble messages for the conversational chat call."""
    captured = {
        k: v for k, v in profile.items()
        if v not in (None, "", [], {}) and k not in ("confidence", "declined_fields")
    }
    missing = _compute_missing(profile)

    if missing:
        missing_block = "\n".join(f"- {label}" for _, label in missing)
        next_field_label = missing[0][1]
        status_block = (
            f"FIELDS STILL MISSING ({len(missing)} remaining):\n{missing_block}\n\n"
            f"NEXT QUESTION MUST BE ABOUT: {next_field_label}\n\n"
            "ABSOLUTE RULES:\n"
            "1. Your reply MUST end with a short specific question about the "
            "NEXT QUESTION field listed above. No exceptions.\n"
            "2. You are FORBIDDEN from using any of these phrases unless the "
            "missing list is empty: "
            "'you have provided all', 'you've given me everything', "
            "'all the necessary information', 'we have everything we need', "
            "'click Finish intake', 'you can continue', 'you're done'.\n"
            "3. Never reply with just 'Thank you' or 'I understand' — always "
            "follow with the next question.\n"
            f"4. There are still {len(missing)} field(s) to capture. Keep going."
        )
    else:
        status_block = (
            "ALL REQUIRED FIELDS CAPTURED. Your reply MUST say exactly one "
            "thing: acknowledge the last answer in one sentence, then tell "
            "the caseworker they can click 'Finish intake' to continue. "
            "Do NOT ask any more questions."
        )

    system_with_context = (
        f"{_INTAKE_SYSTEM}\n\n"
        f"CURRENT PARTIAL PROFILE (already captured — do not re-ask):\n"
        f"{json.dumps(captured, indent=2, default=str)}\n\n"
        f"{status_block}"
    )
    messages = [{"role": "system", "content": system_with_context}]
    for turn in turns:
        role = turn.get("role")
        if role in ("user", "assistant") and turn.get("text"):
            messages.append({"role": role, "content": turn["text"]})
    return messages


def _extract_schema() -> dict[str, Any]:
    """JSON schema used to constrain the extraction call's output.

    `additionalProperties: false` is critical — without it Ollama's
    structured-output grammar lets the model invent keys like `"name"`
    (instead of `client_name`). Nested objects must also set it.
    """
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "client_name": {"type": "string"},
            "date_of_birth": {"type": "string", "format": "date"},
            "address": {"type": "string"},
            "city": {"type": "string"},
            "state": {"type": "string"},
            "zip_code": {"type": "string"},
            "phone_number": {"type": "string"},
            "email": {"type": "string"},
            "household_size": {"type": "integer", "minimum": 1},
            "household_members": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {"type": "string", "minLength": 1},
                        "age": {"type": "integer", "minimum": 0, "maximum": 120},
                        "relationship": {"type": "string"},
                        "student": {"type": "boolean"},
                        "disability": {"type": "boolean"},
                    },
                    "required": ["name", "age"],
                },
            },
            "monthly_income": {"type": "number"},
            "income_sources": {"type": "array", "items": {"type": "string"}},
            "monthly_rent": {"type": "number"},
            "utility_cost": {"type": "number"},
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


async def _extract_patch(
    user_text: str,
    profile: dict[str, Any],
) -> dict[str, Any]:
    """Second LLM call: extract structured facts from the latest user turn."""
    profile_snapshot = {
        k: v for k, v in profile.items()
        if v not in (None, "", [], {}) and k not in ("confidence", "declined_fields")
    }
    messages = [
        {"role": "system", "content": _EXTRACT_SYSTEM},
        {
            "role": "user",
            "content": (
                f"CURRENT PROFILE:\n{json.dumps(profile_snapshot, default=str)}\n\n"
                f"CASEWORKER JUST SAID:\n{user_text}\n\n"
                f"Return a JSON object with ONLY new facts from this turn."
            ),
        },
    ]
    response = await _client().chat(
        model=MODEL,
        messages=messages,
        format=_extract_schema(),
        options={"temperature": 0.0},
    )
    raw = response["message"]["content"]
    try:
        patch = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    patch = sanitize_patch(patch)
    return {k: v for k, v in patch.items() if v not in (None, "", [], {})}


def _merge_profile(current: dict[str, Any], patch: dict[str, Any]) -> dict[str, Any]:
    """Merge a flat patch into the current profile dict.

    Lists replace by default (e.g. `household_members` — the latest turn's
    member list is authoritative). `needs` is the exception: it accumulates
    across turns so the caseworker can mention multiple needs over the
    course of the interview without earlier ones being lost.
    """
    merged = dict(current)
    for key, value in patch.items():
        if value is None:
            continue
        if key == "needs" and isinstance(value, list) and current.get("needs"):
            merged[key] = sorted(set(current["needs"]) | set(value))
        else:
            merged[key] = value
    return merged


def _validated_profile(raw: dict[str, Any]) -> dict[str, Any]:
    """Round-trip through ClientProfile to get JSON-safe, validated output."""
    household_members = [
        HouseholdMember(**m) if isinstance(m, dict) else m
        for m in raw.get("household_members", [])
    ]
    profile = ClientProfile(**{**raw, "household_members": household_members})
    return profile.model_dump(mode="json")


async def _detect_language(text: str) -> str | None:
    """Quick LLM call to detect the language of the given text."""
    try:
        response = await _client().chat(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "What language is this text written in? Return ONLY the "
                        "language name in English (e.g. 'Spanish', 'Vietnamese', "
                        "'English'). One word."
                    ),
                },
                {"role": "user", "content": text},
            ],
            options={"temperature": 0.0, "num_predict": 10},
        )
        detected = response["message"]["content"].strip().strip("'\".,")
        return detected if detected else None
    except Exception:
        return None


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
      {type: 'error',   message: str}
    """
    # Detect language BEFORE building chat messages so the first response
    # is already in the right language — not English followed by a switch.
    user_turn_count = sum(1 for t in turns if t.get("role") == "user")
    if profile.get("preferred_language", "English") == "English" and user_turn_count == 1:
        detected = await _detect_language(user_text)
        if detected and detected != "English":
            profile["preferred_language"] = detected
            yield {"type": "language", "language": detected}

    messages = _build_chat_messages(turns, profile)

    try:
        stream = await _client().chat(
            model=MODEL,
            messages=messages,
            stream=True,
            options={"temperature": 0.4},
        )
        async for chunk in stream:
            delta = chunk.get("message", {}).get("content", "")
            if delta:
                yield {"type": "delta", "text": delta}
    except Exception as exc:  # network / Ollama down / model missing
        yield {
            "type": "error",
            "message": f"Gemma stream failed: {exc}",
        }
        yield {"type": "done"}
        return

    # Second pass: extract a profile patch from the latest user turn.
    try:
        patch = await _extract_patch(user_text, profile)
    except Exception as exc:
        patch = {}
        yield {
            "type": "error",
            "message": f"Profile extraction failed (non-fatal): {exc}",
        }

    if patch:
        merged = _merge_profile(profile, patch)
        try:
            validated = _validated_profile(merged)
            yield {"type": "profile", "profile": validated}
        except Exception as exc:
            yield {
                "type": "error",
                "message": f"Profile validation failed: {exc}",
            }

    yield {"type": "done"}
