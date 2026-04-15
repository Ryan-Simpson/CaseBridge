from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

Need = Literal[
    "food",
    "housing",
    "healthcare",
    "childcare",
    "utilities",
    "legal",
    "mental_health",
    "employment",
]

Severity = Literal["red", "amber"]
Language = Literal["en", "es"]


class HouseholdMember(BaseModel):
    name: str
    age: int | None = None
    relationship: str | None = None
    disability: bool = False
    student: bool = False


class RiskFlag(BaseModel):
    severity: Severity
    category: str
    span: str | None = None
    reason: str


class ClientProfile(BaseModel):
    client_name: str | None = None
    date_of_birth: date | None = None
    preferred_language: Language = "en"

    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None

    household_size: int | None = None
    household_members: list[HouseholdMember] = Field(default_factory=list)

    monthly_income: Decimal | None = None
    income_sources: list[str] = Field(default_factory=list)
    monthly_rent: Decimal | None = None
    utility_cost: Decimal | None = None

    needs: list[Need] = Field(default_factory=list)
    risk_flags: list[RiskFlag] = Field(default_factory=list)

    declined_fields: list[str] = Field(default_factory=list)
    confidence: dict[str, float] = Field(default_factory=dict)


class ProgramCandidate(BaseModel):
    program_id: str
    name: str
    agency: str | None = None
    url: str | None = None
    eligibility_summary: str
    required_docs: list[str] = Field(default_factory=list)


class EligibilityResult(BaseModel):
    program_id: str
    eligible: bool
    reasons: list[str] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)


class ActionCard(BaseModel):
    program_id: str
    submission_url: str | None = None
    docs_needed: list[str] = Field(default_factory=list)
    deadline: str | None = None
    notes: str | None = None
