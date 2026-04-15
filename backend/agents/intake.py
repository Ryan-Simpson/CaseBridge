"""Intake Agent — conversational interview, streams via Ollama.

Reads prompts/intake_{en,es}.md at startup, holds session history, streams
assistant turns, and emits partial ClientProfile updates via
Instructor-validated tool calls.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from schemas import ClientProfile


async def run(
    session_id: str,
    turns: list[dict[str, str]],
    profile: ClientProfile,
    user_text: str,
) -> AsyncIterator[dict[str, Any]]:
    """Stream assistant deltas and profile patches for a single user turn.

    Yields SSE-shaped dicts: {type: 'delta', text: str} or
    {type: 'profile', profile: dict} or {type: 'done'}.
    """
    raise NotImplementedError("Day 2")
    yield  # pragma: no cover — keep generator signature
