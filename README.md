# CaseBridge

**CPP AI Hackathon 2026 · Category 5 · SDGs 1, 3, 10, 11**

## Problem

Social workers and caseworkers spend **60–70% of their time** on administrative tasks — writing case notes, searching for resources, and filling out referral forms. This leaves less time for the people who need them most.

## Solution

CaseBridge uses AI to automate the three biggest administrative time sinks:

- **The Scribe** — Paste a session transcript, get a professional case note (SOAP, DAP, or Narrative) in seconds
- **Resource Brain** — Describe a client's situation, get matched community resources ranked by relevance
- **Form Filler** — Auto-populate referral forms and applications from case data

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS v4
- **AI:** Claude API (Anthropic) for case note generation and resource matching
- **Fonts:** DM Sans + Source Serif 4
- **Deployment:** Vercel

## SDGs Addressed

- **SDG 1** — No Poverty (resource matching for financial assistance)
- **SDG 3** — Good Health and Well-Being (healthcare referrals, mental health support)
- **SDG 10** — Reduced Inequalities (equitable access to services)
- **SDG 11** — Sustainable Cities and Communities (connecting people to local resources)

## Setup

```bash
git clone <repo-url>
cd casebridge
npm install
```

Create a `.env` file:

```
VITE_ANTHROPIC_API_KEY=your_key_here
```

Run the development server:

```bash
npm run dev
```

## Demo Mode

CaseBridge works fully without an API key. All features fall back to realistic hardcoded demo data so you can experience the complete workflow. The demo uses the case of Maria Santos, a single mother navigating housing instability, food insecurity, and healthcare access challenges.

---

*Demo only — no real client data is collected or stored.*
