"""Form Filler Agent — LLM-driven browser automation via MCP.

Flow per form:

1. Connect to the Playwright MCP server (Streamable HTTP).
2. Navigate to the target URL.
3. Take an accessibility snapshot of the page.
4. Ask Gemma 4 E4B (schema-constrained) to map profile fields to the
   form's refs.
5. Execute a single `browser_fill_form` call with the mapping.
6. Take a final snapshot so the UI can confirm what landed.

The agent NEVER clicks submit. The caseworker reviews and submits
manually. Errors at any stage are surfaced as SSE `error` events so
the frontend can display them without crashing the wizard.
"""

from __future__ import annotations

import json
import logging
import os
from collections.abc import AsyncIterator
from typing import Any

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from ollama import AsyncClient

from agents._common import MODEL, OLLAMA_HOST, PROMPTS_DIR
from schemas import ClientProfile

logger = logging.getLogger(__name__)

MCP_SERVER_URL = os.environ.get("CASEBRIDGE_MCP_URL", "http://127.0.0.1:8931/mcp")

_FORM_FILLER_SYSTEM = (PROMPTS_DIR / "form_filler.md").read_text()


def _fill_schema() -> dict[str, Any]:
    """JSON schema that matches MCP browser_fill_form's `fields` array."""
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "fields": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "name": {"type": "string"},
                        "type": {
                            "type": "string",
                            "enum": ["textbox", "checkbox", "radio", "combobox", "slider"],
                        },
                        "ref": {"type": "string"},
                        "value": {"type": "string"},
                    },
                    "required": ["name", "type", "ref", "value"],
                },
            },
        },
        "required": ["fields"],
    }


async def _map_profile_to_fields(
    profile: ClientProfile,
    snapshot_text: str,
) -> list[dict[str, Any]]:
    """One Gemma call: return the `fields` array MCP browser_fill_form expects."""
    profile_json = json.dumps(profile.model_dump(mode="json"), indent=2, default=str)
    user_prompt = (
        f"CLIENT PROFILE:\n{profile_json}\n\n"
        f"PAGE SNAPSHOT:\n{snapshot_text}\n\n"
        f"Return the fields array."
    )
    response = await AsyncClient(host=OLLAMA_HOST).chat(
        model=MODEL,
        messages=[
            {"role": "system", "content": _FORM_FILLER_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
        format=_fill_schema(),
        options={"temperature": 0.0},
    )
    raw = response["message"]["content"]
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []
    return data.get("fields", [])


def _extract_text(mcp_result: Any) -> str:
    """MCP tool results are structured as a list of content items; join text."""
    parts = []
    for item in getattr(mcp_result, "content", []):
        text = getattr(item, "text", None)
        if text:
            parts.append(text)
    return "\n".join(parts)


async def run(
    profile: ClientProfile,
    target_url: str,
) -> AsyncIterator[dict[str, Any]]:
    """Drive the Playwright MCP server to fill a form.

    Yields SSE-shaped dicts:
      {type: 'status',  message: str}
      {type: 'fields',  fields: list}   — what we decided to fill
      {type: 'done',    filled: int}
      {type: 'error',   message: str}
    """
    yield {"type": "status", "message": f"Connecting to MCP server at {MCP_SERVER_URL}"}

    try:
        async with streamablehttp_client(MCP_SERVER_URL) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                yield {"type": "status", "message": "MCP session initialized"}

                yield {"type": "status", "message": f"Navigating to {target_url}"}
                await session.call_tool("browser_navigate", {"url": target_url})

                yield {"type": "status", "message": "Capturing page snapshot"}
                snapshot_result = await session.call_tool("browser_snapshot", {})
                snapshot_text = _extract_text(snapshot_result)

                yield {"type": "status", "message": "Asking Gemma to map fields"}
                fields = await _map_profile_to_fields(profile, snapshot_text)
                if not fields:
                    yield {"type": "error", "message": "Gemma returned no fields to fill"}
                    return

                yield {"type": "fields", "fields": fields}
                yield {"type": "status", "message": f"Filling {len(fields)} fields"}

                await session.call_tool("browser_fill_form", {"fields": fields})

                yield {"type": "status", "message": "Taking final snapshot"}
                await session.call_tool("browser_snapshot", {})

                yield {"type": "done", "filled": len(fields)}
    except Exception as exc:
        logger.exception("form_filler error")
        yield {"type": "error", "message": f"{type(exc).__name__}: {exc}"}
