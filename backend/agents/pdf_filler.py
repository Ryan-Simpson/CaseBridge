"""Deterministic PDF form filler for benefit-program applications.

Loads a pre-built AcroForm template from ``backend/forms/{program_id}.pdf``,
populates its text fields from a ``ClientProfile``, and returns the bytes of
the filled PDF.

No LLM, no browser, no MCP — just a static per-program field map.
"""

from __future__ import annotations

from decimal import Decimal
from io import BytesIO
from pathlib import Path
from typing import Callable, Dict

from pypdf import PdfReader, PdfWriter
from pypdf.generic import BooleanObject, NameObject

from schemas import ClientProfile

FORMS_DIR = Path(__file__).resolve().parent.parent / "forms"


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------


def _money(value: Decimal | float | int | None) -> str:
    if value is None:
        return ""
    try:
        # Decimal → int via quantize so $1500.00 becomes 1500
        amount = int(Decimal(value))
    except (ValueError, TypeError):
        return ""
    return f"${amount:,}"


def _iso_date(value) -> str:
    if value is None:
        return ""
    try:
        return value.isoformat()
    except AttributeError:
        return str(value)


def _csv_list(values) -> str:
    if not values:
        return ""
    parts = [str(v) for v in values if v]
    return ", ".join(parts)


def _household_members(members) -> str:
    if not members:
        return ""
    parts = []
    for m in members:
        # Support both pydantic model and plain dict
        name = getattr(m, "name", None) or (m.get("name") if isinstance(m, dict) else None) or ""
        age = getattr(m, "age", None) if not isinstance(m, dict) else m.get("age")
        if age is not None:
            parts.append(f"{name} (age {age})")
        else:
            parts.append(str(name))
    return ", ".join(p for p in parts if p)


def _str(value) -> str:
    if value is None:
        return ""
    return str(value)


def _bool_yn(value) -> str:
    if value is None:
        return ""
    return "Yes" if bool(value) else "No"


def _needs_summary(p: ClientProfile) -> str:
    return _csv_list(p.needs)


# ---------------------------------------------------------------------------
# Common field map — shared by all programs
# ---------------------------------------------------------------------------

COMMON_MAP: Dict[str, Callable[[ClientProfile], str]] = {
    "applicant_name":     lambda p: _str(p.client_name),
    "date_of_birth":      lambda p: _iso_date(p.date_of_birth),
    "preferred_language": lambda p: _str(p.preferred_language),

    "street_address":     lambda p: _str(p.address),
    "city":               lambda p: _str(p.city),
    "state":              lambda p: _str(p.state),
    "zip_code":           lambda p: _str(p.zip_code),

    "phone_number":       lambda p: _str(p.phone_number),
    "email":              lambda p: _str(p.email),

    "household_size":     lambda p: _str(p.household_size),
    "household_members":  lambda p: _household_members(p.household_members),

    "monthly_income":     lambda p: _money(p.monthly_income),
    "monthly_rent":       lambda p: _money(p.monthly_rent),
    "utility_cost":       lambda p: _money(p.utility_cost),
    "income_sources":     lambda p: _csv_list(p.income_sources),

    "needs_summary":      _needs_summary,
}


# ---------------------------------------------------------------------------
# Program-specific maps
#
# ClientProfile does not carry landlord / child / utility-provider data yet,
# so the best-effort fallback is an empty string. We still register the keys
# so the reviewer can see every field was considered.
# ---------------------------------------------------------------------------

def _blank(_p: ClientProfile) -> str:
    return ""


CALFRESH_MAP: Dict[str, Callable[[ClientProfile], str]] = {
    **COMMON_MAP,
    "citizenship_status": _blank,
    "expedited_service":  _blank,
}

ERAP_MAP: Dict[str, Callable[[ClientProfile], str]] = {
    **COMMON_MAP,
    "landlord_name":      _blank,
    "landlord_contact":   _blank,
    "months_past_due":    _blank,
    "eviction_notice":    _blank,
}

WIC_MAP: Dict[str, Callable[[ClientProfile], str]] = {
    **COMMON_MAP,
    # Best-effort: first household member under 5 → child slot.
    "child_name": lambda p: next(
        (m.name for m in p.household_members if (m.age or 99) < 5 and m.name),
        "",
    ),
    "child_dob":         _blank,
    "pregnancy_status":  _blank,
}

LIHEAP_MAP: Dict[str, Callable[[ClientProfile], str]] = {
    **COMMON_MAP,
    "utility_provider":       _blank,
    "utility_account_number": _blank,
    "shutoff_notice":         _blank,
}

SCHOOL_MEALS_MAP: Dict[str, Callable[[ClientProfile], str]] = {
    **COMMON_MAP,
    # Best-effort: first school-aged household member → student slot.
    "student_name": lambda p: next(
        (m.name for m in p.household_members if (m.age is not None and 5 <= m.age <= 18) and m.name),
        "",
    ),
    "school_name":   _blank,
    "grade_level":   _blank,
}

PROGRAM_MAPS: Dict[str, Dict[str, Callable[[ClientProfile], str]]] = {
    "calfresh":     CALFRESH_MAP,
    "erap":         ERAP_MAP,
    "wic":          WIC_MAP,
    "liheap":       LIHEAP_MAP,
    "school_meals": SCHOOL_MEALS_MAP,
}


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def run(profile: ClientProfile, program_id: str) -> bytes:
    """Fill the AcroForm PDF for ``program_id`` with values from ``profile``.

    Returns the bytes of the filled PDF, suitable for returning as
    ``application/pdf`` to the client.
    """
    if program_id not in PROGRAM_MAPS:
        raise ValueError(f"Unknown program_id: {program_id!r}")

    template_path = FORMS_DIR / f"{program_id}.pdf"
    if not template_path.exists():
        raise FileNotFoundError(
            f"Template not found: {template_path}. "
            f"Run backend/scripts/build_templates.py first."
        )

    reader = PdfReader(str(template_path))
    writer = PdfWriter(clone_from=reader)

    # Ensure the AcroForm dictionary has NeedAppearances = True so text
    # the filled values actually show in most viewers.
    if "/AcroForm" in writer._root_object:
        writer._root_object["/AcroForm"].update(
            {NameObject("/NeedAppearances"): BooleanObject(True)}
        )

    field_map = PROGRAM_MAPS[program_id]
    values: Dict[str, str] = {}
    for name, fn in field_map.items():
        try:
            values[name] = fn(profile)
        except Exception:  # noqa: BLE001 — never fail form fill for one bad field
            values[name] = ""

    # ``flatten=True`` bakes the appearance streams into the page content, so
    # the filled values survive ``extract_text()`` and render in any viewer
    # that doesn't honour ``/NeedAppearances``. Trade-off: the form is no
    # longer interactively editable — acceptable for a "review before
    # submission" draft that the caseworker will print or re-scan.
    writer.update_page_form_field_values(
        writer.pages[0],
        values,
        auto_regenerate=True,
        flatten=True,
    )

    buf = BytesIO()
    writer.write(buf)
    return buf.getvalue()
