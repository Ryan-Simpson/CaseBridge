"""Eligibility Agent — deterministic json-logic rules evaluation.

Loads every `rules/*.json` file at module import. For each program,
evaluates the list of labeled conditions against a ClientProfile and
returns an EligibilityResult with reasons explaining the pass or fail
state of each condition.

Never calls an LLM. Runtime behavior is pure Python — reproducible,
unit-testable, and independent of Ollama.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from json_logic import jsonLogic

from schemas import ClientProfile, EligibilityResult

_RULES_DIR = Path(__file__).parent.parent / "rules"


def _load_rules() -> list[dict[str, Any]]:
    """Load every rule file in alphabetical order, stable for the demo."""
    rules = []
    for path in sorted(_RULES_DIR.glob("*.json")):
        rules.append(json.loads(path.read_text()))
    return rules


RULES: list[dict[str, Any]] = _load_rules()
RULES_BY_ID: dict[str, dict[str, Any]] = {r["program_id"]: r for r in RULES}


def _to_data(profile: ClientProfile) -> dict[str, Any]:
    """Shape a ClientProfile into the plain-dict form json-logic expects.

    Decimal and date values don't round-trip through json-logic's
    arithmetic operators, so we coerce them to float and ISO strings.
    Nested household_members become plain dicts so `some`/`all` operators
    can iterate them with `{"var": "age"}` etc.
    """
    data = profile.model_dump(mode="json")
    for field in ("monthly_income", "monthly_rent", "utility_cost"):
        value = data.get(field)
        if value is not None:
            data[field] = float(value)
    return data


def _missing_fields(profile_data: dict[str, Any], required: list[str]) -> list[str]:
    """Return fields that are truly unset.

    Empty collections (`[]`, `{}`) are treated as known-empty, not missing.
    A single-person household has `household_members == []`, which is a
    valid state the rule evaluator can handle — it just means the `some`
    operator returns False.
    """
    missing = []
    for field in required:
        value = profile_data.get(field)
        if value is None or value == "":
            missing.append(field)
    return missing


def _evaluate_program(
    rule: dict[str, Any],
    profile_data: dict[str, Any],
) -> EligibilityResult:
    program_id = rule["program_id"]
    required_fields = rule.get("required_fields", [])

    missing = _missing_fields(profile_data, required_fields)
    if missing:
        return EligibilityResult(
            program_id=program_id,
            eligible=False,
            reasons=[f"Cannot evaluate — missing fields: {', '.join(missing)}"],
            missing_fields=missing,
        )

    passed: list[str] = []
    failed: list[str] = []
    for condition in rule.get("conditions", []):
        label = condition["label"]
        try:
            ok = bool(jsonLogic(condition["check"], profile_data))
        except Exception as exc:
            failed.append(f"{label} (rule error: {exc})")
            continue
        if ok:
            passed.append(label)
        else:
            failed.append(label)

    eligible = not failed
    if eligible:
        reasons = [f"Meets: {label}" for label in passed]
    else:
        reasons = [f"Fails: {label}" for label in failed]

    return EligibilityResult(
        program_id=program_id,
        eligible=eligible,
        reasons=reasons,
        missing_fields=[],
    )


def run(profile: ClientProfile) -> list[EligibilityResult]:
    """Evaluate every loaded program against a ClientProfile."""
    data = _to_data(profile)
    return [_evaluate_program(rule, data) for rule in RULES]
