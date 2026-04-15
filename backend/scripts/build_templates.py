"""Generate deterministic AcroForm PDF templates for the five benefit programs.

Run:
    ~/CaseBridge/backend/.venv/bin/python backend/scripts/build_templates.py

Produces:
    backend/forms/calfresh.pdf
    backend/forms/erap.pdf
    backend/forms/wic.pdf
    backend/forms/liheap.pdf
    backend/forms/school_meals.pdf

Each PDF is a 1-page US Letter form with an AcroForm layer. Fields are
text inputs that can be filled in later by ``backend/agents/pdf_filler.py``.

Programs:
    calfresh     -> CalFresh (SNAP)            (CDSS)
    erap         -> Emergency Rental Assistance (BCSH)
    wic          -> WIC (Women, Infants, Children) (CDPH)
    liheap       -> LIHEAP Energy Assistance    (CSD)
    school_meals -> Free & Reduced-Price School Meals (CDE)
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from reportlab.lib.colors import Color, black
from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PAGE_WIDTH, PAGE_HEIGHT = LETTER
MARGIN = 72  # 1 inch

BRAND_BLUE = Color(28 / 255, 90 / 255, 168 / 255)
GRAY = Color(0.40, 0.40, 0.42)
LIGHT_GRAY = Color(0.70, 0.70, 0.72)
RULE_GRAY = Color(0.80, 0.80, 0.82)
FIELD_BORDER = Color(0.60, 0.60, 0.62)
FIELD_BG = Color(0.97, 0.97, 0.98)

# Field sizing / typography
LABEL_SIZE = 9
FIELD_TEXT_SIZE = 10
LEGEND_SIZE = 11
DEFAULT_FIELD_HEIGHT = 16

REPO_ROOT = Path(__file__).resolve().parents[1]
RULES_DIR = REPO_ROOT / "rules"
FORMS_DIR = REPO_ROOT / "forms"

WATERMARK_TEXT = "CaseBridge draft — review before submission"

# ---------------------------------------------------------------------------
# Program metadata (pulled from backend/rules/*.json so headers stay canonical)
# ---------------------------------------------------------------------------

# Display name overrides — the spec calls out these exact strings:
DISPLAY_NAME_OVERRIDES = {
    "calfresh":     "CalFresh (SNAP)",
    "erap":         "Emergency Rental Assistance",
    "wic":          "WIC (Women, Infants, Children)",
    "liheap":       "LIHEAP Energy Assistance",
    "school_meals": "Free & Reduced-Price School Meals",
}

# Common section spec: (legend, [(field_name, label, width, height, multiline), ...])
# width/height in points; if multiline True the field will be taller.

COMMON_SECTIONS: list[tuple[str, list[tuple[str, str, float, float, bool]]]] = [
    (
        "Applicant",
        [
            ("applicant_name",      "Full legal name",                260, DEFAULT_FIELD_HEIGHT, False),
            ("date_of_birth",       "Date of birth (YYYY-MM-DD)",     140, DEFAULT_FIELD_HEIGHT, False),
            ("preferred_language",  "Preferred language",             140, DEFAULT_FIELD_HEIGHT, False),
        ],
    ),
    (
        "Residence",
        [
            ("street_address",      "Street address",                 300, DEFAULT_FIELD_HEIGHT, False),
            ("city",                "City",                           160, DEFAULT_FIELD_HEIGHT, False),
            ("state",               "State",                           40, DEFAULT_FIELD_HEIGHT, False),
            ("zip_code",            "ZIP",                             70, DEFAULT_FIELD_HEIGHT, False),
        ],
    ),
    (
        "Contact",
        [
            ("phone_number",        "Phone number",                   180, DEFAULT_FIELD_HEIGHT, False),
            ("email",               "Email",                          260, DEFAULT_FIELD_HEIGHT, False),
        ],
    ),
    (
        "Household",
        [
            ("household_size",      "Household size",                  60, DEFAULT_FIELD_HEIGHT, False),
            ("household_members",   "Household members (name, age)",  460, 45,                   True),
        ],
    ),
    (
        "Finances",
        [
            ("monthly_income",      "Gross monthly income",           140, DEFAULT_FIELD_HEIGHT, False),
            ("monthly_rent",        "Monthly rent",                   120, DEFAULT_FIELD_HEIGHT, False),
            ("utility_cost",        "Monthly utility cost",           120, DEFAULT_FIELD_HEIGHT, False),
            ("income_sources",      "Income sources",                 460, DEFAULT_FIELD_HEIGHT, False),
        ],
    ),
    (
        "Needs and notes",
        [
            ("needs_summary",       "Needs summary",                  460, 35,                   True),
        ],
    ),
]

PROGRAM_SPECIFIC: dict[str, list[tuple[str, str, float, float, bool]]] = {
    "calfresh": [
        ("citizenship_status",       "Citizenship status",            240, DEFAULT_FIELD_HEIGHT, False),
        ("expedited_service",        "Expedited service requested?",  160, DEFAULT_FIELD_HEIGHT, False),
    ],
    "erap": [
        ("landlord_name",            "Landlord name",                 240, DEFAULT_FIELD_HEIGHT, False),
        ("landlord_contact",         "Landlord phone or email",       240, DEFAULT_FIELD_HEIGHT, False),
        ("months_past_due",          "Months past due",                80, DEFAULT_FIELD_HEIGHT, False),
        ("eviction_notice",          "Eviction notice received?",     140, DEFAULT_FIELD_HEIGHT, False),
    ],
    "wic": [
        ("child_name",               "Child name",                    240, DEFAULT_FIELD_HEIGHT, False),
        ("child_dob",                "Child date of birth",           160, DEFAULT_FIELD_HEIGHT, False),
        ("pregnancy_status",         "Pregnancy or postpartum status", 240, DEFAULT_FIELD_HEIGHT, False),
    ],
    "liheap": [
        ("utility_provider",         "Utility provider",              240, DEFAULT_FIELD_HEIGHT, False),
        ("utility_account_number",   "Account number",                200, DEFAULT_FIELD_HEIGHT, False),
        ("shutoff_notice",           "Shutoff notice received?",      160, DEFAULT_FIELD_HEIGHT, False),
    ],
    "school_meals": [
        ("student_name",             "Student name",                  240, DEFAULT_FIELD_HEIGHT, False),
        ("school_name",              "School name",                   240, DEFAULT_FIELD_HEIGHT, False),
        ("grade_level",              "Grade level",                    80, DEFAULT_FIELD_HEIGHT, False),
    ],
}

# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------


def _load_rule(program_id: str) -> dict:
    path = RULES_DIR / f"{program_id}.json"
    with path.open() as f:
        return json.load(f)


def _draw_header(c: canvas.Canvas, program_id: str, rule: dict) -> float:
    """Draw program title + agency + watermark. Returns y of next content line."""
    display_name = DISPLAY_NAME_OVERRIDES.get(program_id, rule["name"])
    agency = rule.get("agency", "")

    top_y = PAGE_HEIGHT - MARGIN

    # Program name
    c.setFillColor(BRAND_BLUE)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(MARGIN, top_y, display_name)

    # Agency subtitle
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 10)
    c.drawString(MARGIN, top_y - 16, agency)

    # Right-aligned watermark
    c.setFillColor(LIGHT_GRAY)
    c.setFont("Helvetica-Oblique", 9)
    c.drawRightString(PAGE_WIDTH - MARGIN, top_y, WATERMARK_TEXT)

    # Horizontal rule
    rule_y = top_y - 28
    c.setStrokeColor(RULE_GRAY)
    c.setLineWidth(0.75)
    c.line(MARGIN, rule_y, PAGE_WIDTH - MARGIN, rule_y)

    return rule_y - 18  # return y where next section legend should start


def _draw_footer(c: canvas.Canvas) -> None:
    y = MARGIN - 26
    c.setStrokeColor(RULE_GRAY)
    c.setLineWidth(0.75)
    c.line(MARGIN, y + 10, PAGE_WIDTH - MARGIN, y + 10)

    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    today = date.today().isoformat()
    c.drawString(MARGIN, y, f"Generated by CaseBridge · {today}")
    c.drawRightString(PAGE_WIDTH - MARGIN, y, "Page 1 of 1")


def _draw_legend(c: canvas.Canvas, text: str, y: float) -> float:
    c.setFillColor(BRAND_BLUE)
    c.setFont("Helvetica-Bold", LEGEND_SIZE)
    c.drawString(MARGIN, y, text.upper())

    # Subtle underline under legend
    c.setStrokeColor(RULE_GRAY)
    c.setLineWidth(0.4)
    c.line(MARGIN, y - 3, PAGE_WIDTH - MARGIN, y - 3)

    return y - 16


def _draw_field_row(
    c: canvas.Canvas,
    fields: list[tuple[str, str, float, float, bool]],
    start_y: float,
) -> float:
    """Draw one row of fields. Wraps to multiple rows if they overflow width.

    Returns y position (top of next row).
    """
    gap_x = 14
    gap_y = 10

    x = MARGIN
    row_max_h = 0.0
    y = start_y

    for name, label, width, height, multiline in fields:
        # Wrap if this field would overflow the right margin
        if x + width > PAGE_WIDTH - MARGIN and x != MARGIN:
            y -= row_max_h + gap_y
            x = MARGIN
            row_max_h = 0.0

        # Label above the field
        c.setFillColor(black)
        c.setFont("Helvetica", LABEL_SIZE)
        label_y = y - LABEL_SIZE - 1
        c.drawString(x, label_y, label)

        # AcroForm textfield under the label
        field_y = label_y - height - 3
        c.acroForm.textfield(
            name=name,
            tooltip=label,
            x=x,
            y=field_y,
            width=width,
            height=height,
            borderColor=FIELD_BORDER,
            fillColor=FIELD_BG,
            textColor=black,
            forceBorder=True,
            fontName="Helvetica",
            fontSize=FIELD_TEXT_SIZE,
            fieldFlags="multiline" if multiline else "",
        )

        row_h = LABEL_SIZE + 4 + height
        if row_h > row_max_h:
            row_max_h = row_h
        x += width + gap_x

    return y - row_max_h - gap_y


def _draw_section(
    c: canvas.Canvas,
    legend: str,
    fields: list[tuple[str, str, float, float, bool]],
    y: float,
) -> float:
    y = _draw_legend(c, legend, y)
    y = _draw_field_row(c, fields, y)
    return y - 4  # small gap after section


# ---------------------------------------------------------------------------
# Main build
# ---------------------------------------------------------------------------


def build_pdf(program_id: str) -> Path:
    rule = _load_rule(program_id)
    FORMS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = FORMS_DIR / f"{program_id}.pdf"

    c = canvas.Canvas(str(out_path), pagesize=LETTER)
    c.setTitle(f"{DISPLAY_NAME_OVERRIDES[program_id]} — CaseBridge draft")
    c.setAuthor("CaseBridge")

    y = _draw_header(c, program_id, rule)

    for legend, fields in COMMON_SECTIONS:
        y = _draw_section(c, legend, fields, y)

    extras = PROGRAM_SPECIFIC.get(program_id, [])
    if extras:
        y = _draw_section(c, "Program-specific", extras, y)

    _draw_footer(c)
    c.showPage()
    c.save()
    return out_path


def main() -> None:
    programs = ["calfresh", "erap", "wic", "liheap", "school_meals"]
    for pid in programs:
        out = build_pdf(pid)
        print(f"wrote {out}")

    # Verify each PDF has the expected AcroForm fields
    try:
        from pypdf import PdfReader
    except ImportError:
        print("pypdf not installed — skipping field-name verification")
        return

    print()
    for pid in programs:
        reader = PdfReader(str(FORMS_DIR / f"{pid}.pdf"))
        fields = reader.get_form_text_fields() or {}
        expected_common = [
            name for _, rows in COMMON_SECTIONS for (name, *_rest) in rows
        ]
        expected_extra = [name for (name, *_rest) in PROGRAM_SPECIFIC.get(pid, [])]
        expected = set(expected_common + expected_extra)
        got = set(fields.keys())
        missing = expected - got
        extra = got - expected
        status = "ok" if not missing and not extra else "MISMATCH"
        print(f"{pid:14s} {status:8s} fields={len(got)} expected={len(expected)}")
        if missing:
            print(f"   missing: {sorted(missing)}")
        if extra:
            print(f"   extra:   {sorted(extra)}")


if __name__ == "__main__":
    main()
