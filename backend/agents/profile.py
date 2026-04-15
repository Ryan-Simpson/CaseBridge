"""Profile Agent — normalizes interview transcript to a validated ClientProfile.

Outlines-constrained JSON pass that cleans ambiguous fields the streaming
intake left messy (e.g. "about 1200 a month" -> Decimal("1200")).
"""

from __future__ import annotations

from schemas import ClientProfile


async def run(turns: list[dict[str, str]], partial: ClientProfile) -> ClientProfile:
    raise NotImplementedError("Day 2")
