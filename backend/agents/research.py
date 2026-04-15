"""Research Agent — cached program candidates for the demo path.

Cache mode reads research_cache/maria_santos.json keyed by profile fingerprint.
Live mode (RESEARCH_MODE=live) hits SearXNG and parses government program
pages — never used in the demo critical path.
"""

from __future__ import annotations

from schemas import ClientProfile, ProgramCandidate


async def run(profile: ClientProfile) -> list[ProgramCandidate]:
    raise NotImplementedError("Day 4")
