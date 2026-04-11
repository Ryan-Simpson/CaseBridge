// Knowledge base for the Help chatbot
// Organized by topic with keywords for matching and rich response data

export const HELP_TOPICS = [
  {
    id: 'calfresh',
    keywords: ['calfresh', 'snap', 'food stamps', 'food assistance', 'food benefits', 'ebt', 'grocery', 'food help'],
    title: 'CalFresh / SNAP Benefits',
    response: `**CalFresh** (California's SNAP program) provides monthly food benefits on an EBT card.

**Who qualifies:** Households with gross income below 200% of the Federal Poverty Level. A family of 3 can earn up to ~$3,326/month.

**How to apply:**
- Online at BenefitsCal.com
- By phone: 1-877-847-3663
- In person at your county social services office

**What you need:** ID, proof of income, rent/mortgage info, utility bills.

**Processing time:** 30 days (or 7 days for emergency/expedited).`,
    links: [
      { label: 'Apply at BenefitsCal.com', url: 'https://benefitscal.com' },
      { label: 'CalFresh Info (CDSS)', url: 'https://www.cdss.ca.gov/calfresh' },
      { label: 'Find your county office', url: 'https://www.cdss.ca.gov/county-offices' },
    ],
  },
  {
    id: 'erap',
    keywords: ['erap', 'rent', 'rental assistance', 'eviction', 'housing', 'rent help', 'behind on rent', 'landlord', 'tenant'],
    title: 'Emergency Rental Assistance (ERAP)',
    response: `**Emergency Rental Assistance Program (ERAP)** helps tenants who are behind on rent or at risk of eviction.

**Who qualifies:** Renters with household income below 80% of Area Median Income who experienced financial hardship.

**What it covers:** Up to 12 months of past-due rent, up to 3 months of future rent, and utility arrears.

**How to apply:**
- Contact your local Community Action Agency
- Through 211 (dial 2-1-1) for local program referrals
- HUD's rental assistance locator online

**Important:** If you've received an eviction notice, mention this — many programs fast-track urgent cases.`,
    links: [
      { label: 'HUD Rental Assistance', url: 'https://www.hud.gov/topics/rental_assistance' },
      { label: 'Find local help via 211', url: 'https://www.211.org' },
      { label: 'National Low Income Housing Coalition', url: 'https://nlihc.org/rental-assistance' },
      { label: 'Tenant rights (HUD)', url: 'https://www.hud.gov/topics/rental_assistance/tenantrights' },
    ],
  },
  {
    id: 'medi-cal',
    keywords: ['medi-cal', 'medicaid', 'health insurance', 'medical', 'healthcare', 'doctor', 'medication', 'prescription', 'uninsured'],
    title: 'Medi-Cal / Medicaid',
    response: `**Medi-Cal** is California's Medicaid program providing free or low-cost health coverage.

**Who qualifies:** Adults with income up to 138% FPL (~$20,783/year for an individual). Children, pregnant women, seniors, and people with disabilities may qualify at higher income levels.

**What it covers:** Doctor visits, hospital care, prescriptions, mental health, dental, vision, and more.

**How to apply:**
- Online at BenefitsCal.com or CoveredCA.com
- By phone: 1-800-300-1506
- At your county social services office

**Processing:** Usually 45 days. Coverage can be retroactive up to 3 months.`,
    links: [
      { label: 'Apply at BenefitsCal.com', url: 'https://benefitscal.com' },
      { label: 'Medi-Cal info (DHCS)', url: 'https://www.dhcs.ca.gov/services/medi-cal' },
      { label: 'Covered California', url: 'https://www.coveredca.com' },
    ],
  },
  {
    id: 'calworks',
    keywords: ['calworks', 'tanf', 'cash aid', 'cash assistance', 'welfare', 'temporary assistance'],
    title: 'CalWORKs / TANF Cash Aid',
    response: `**CalWORKs** (California Work Opportunity and Responsibility to Kids) provides temporary cash aid and services to families with children.

**Who qualifies:** Families with children who have low income and limited resources. Must participate in welfare-to-work activities.

**Benefits:** Monthly cash grants (varies by county, family size, and income). A family of 3 may receive around $900-1,000/month.

**How to apply:**
- Online at BenefitsCal.com
- At your county social services office
- By phone through your county office

**Additional services:** Job training, childcare, transportation assistance.`,
    links: [
      { label: 'Apply at BenefitsCal.com', url: 'https://benefitscal.com' },
      { label: 'CalWORKs info (CDSS)', url: 'https://www.cdss.ca.gov/calworks' },
    ],
  },
  {
    id: 'unemployment',
    keywords: ['unemployment', 'edd', 'job loss', 'laid off', 'fired', 'lost my job', 'unemployment benefits', 'ui claim'],
    title: 'Unemployment Insurance (EDD)',
    response: `**Unemployment Insurance (UI)** provides temporary payments if you lost your job through no fault of your own.

**Who qualifies:** Must have earned enough wages during a base period, be able and available to work, and be actively seeking work.

**Benefit amount:** Ranges from $40 to $450 per week for up to 26 weeks.

**How to file:**
- Online at UI Online (EDD website)
- By phone: 1-800-300-5616
- Must certify for benefits every two weeks

**Important:** File as soon as possible — benefits are not retroactive to your last day of work.`,
    links: [
      { label: 'File a UI claim (EDD)', url: 'https://edd.ca.gov/unemployment' },
      { label: 'EDD UI Online', url: 'https://uionline.edd.ca.gov' },
      { label: 'Job search resources (CalJOBS)', url: 'https://www.caljobs.ca.gov' },
    ],
  },
  {
    id: 'mental-health',
    keywords: ['mental health', 'depression', 'anxiety', 'counseling', 'therapy', 'crisis', 'suicide', 'emotional', 'stress', 'mental wellness'],
    title: 'Mental Health Resources',
    response: `**Mental health support** is available at no cost or low cost through multiple channels.

**Crisis resources:**
- **988 Suicide & Crisis Lifeline:** Call or text 988 (24/7)
- **Crisis Text Line:** Text HOME to 741741
- **SAMHSA Helpline:** 1-800-662-4357

**Ongoing support:**
- County mental health departments offer free services
- Community health centers provide sliding-scale counseling
- NAMI (National Alliance on Mental Illness) has support groups

**Through insurance:** Medi-Cal covers mental health services including therapy and psychiatric care.`,
    links: [
      { label: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org' },
      { label: 'SAMHSA Treatment Locator', url: 'https://findtreatment.gov' },
      { label: 'NAMI (support groups)', url: 'https://www.nami.org/Support-Education' },
      { label: 'County mental health services', url: 'https://www.dhcs.ca.gov/individuals/pages/mhpcontactlist.aspx' },
    ],
  },
  {
    id: 'childcare',
    keywords: ['childcare', 'daycare', 'preschool', 'head start', 'child care', 'babysitter', 'after school'],
    title: 'Childcare Assistance',
    response: `**Subsidized childcare programs** help working families afford quality care for their children.

**Programs available:**
- **Head Start / Early Head Start:** Free preschool for children 0-5 in low-income families
- **CalWORKs Stage 1-3:** Childcare for families receiving or transitioning off CalWORKs
- **Alternative Payment Programs:** Subsidies to use the childcare provider of your choice

**How to find care:**
- Contact your local Resource & Referral agency
- Call 1-800-KIDS-793 for referrals
- Visit the California Child Care Resource & Referral Network

**Eligibility:** Generally for families at or below 85% of State Median Income.`,
    links: [
      { label: 'Head Start locator', url: 'https://eclkc.ohs.acf.hhs.gov/center-locator' },
      { label: 'CA Child Care R&R Network', url: 'https://rrnetwork.org' },
      { label: 'Childcare.gov', url: 'https://www.childcare.gov' },
    ],
  },
  {
    id: 'legal-aid',
    keywords: ['legal aid', 'legal help', 'lawyer', 'attorney', 'court', 'legal rights', 'tenant rights', 'legal services'],
    title: 'Free Legal Aid',
    response: `**Free legal services** are available for low-income individuals through Legal Aid organizations.

**What they help with:**
- Eviction defense and tenant rights
- Family law (custody, divorce, domestic violence)
- Public benefits appeals
- Immigration
- Consumer debt issues

**How to find help:**
- Contact your local Legal Aid Society
- Call 211 for referrals
- Use the Legal Services Corporation's find-a-lawyer tool

**Important:** Many Legal Aid offices have income requirements (usually below 125-200% FPL). Call ahead to check eligibility.`,
    links: [
      { label: 'Find Legal Aid (LSC)', url: 'https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help' },
      { label: 'LawHelp.org', url: 'https://www.lawhelp.org' },
      { label: 'California Courts Self-Help', url: 'https://www.courts.ca.gov/selfhelp.htm' },
    ],
  },
  {
    id: 'domestic-violence',
    keywords: ['domestic violence', 'abuse', 'dv', 'shelter', 'safety', 'restraining order', 'abusive', 'violent partner'],
    title: 'Domestic Violence Resources',
    response: `**If you or someone you know is in immediate danger, call 911.**

**Hotlines (24/7, confidential):**
- **National DV Hotline:** 1-800-799-7233 (SAFE)
- **Text:** START to 88788
- **Online chat:** thehotline.org

**Services available:**
- Emergency shelter placement
- Safety planning
- Legal advocacy and restraining orders
- Counseling for survivors and children
- Transitional housing programs

**For social workers:** These resources can be shared with clients confidentially. Many DV organizations have advocates who can assist with referrals.`,
    links: [
      { label: 'National DV Hotline', url: 'https://www.thehotline.org' },
      { label: 'Find a shelter (DomesticShelters.org)', url: 'https://www.domesticshelters.org' },
      { label: 'CA Partnership to End DV', url: 'https://www.cpedv.org' },
    ],
  },
  {
    id: 'substance-abuse',
    keywords: ['substance abuse', 'addiction', 'drug', 'alcohol', 'rehab', 'recovery', 'sober', 'treatment', 'detox', 'na', 'aa'],
    title: 'Substance Abuse Treatment',
    response: `**Substance abuse treatment** is available at no cost through public programs.

**Finding treatment:**
- **SAMHSA Helpline:** 1-800-662-4357 (free, 24/7, confidential)
- Online treatment locator at findtreatment.gov
- County behavioral health departments

**Types of treatment:**
- Outpatient counseling and group therapy
- Intensive outpatient programs (IOP)
- Residential/inpatient treatment
- Medication-assisted treatment (MAT)
- Sober living / transitional housing

**Medi-Cal** covers substance abuse treatment including detox, residential, and outpatient programs. No insurance needed to access SAMHSA-referred services.`,
    links: [
      { label: 'SAMHSA Treatment Locator', url: 'https://findtreatment.gov' },
      { label: 'SAMHSA Helpline', url: 'https://www.samhsa.gov/find-help/national-helpline' },
      { label: 'NA Meeting Finder', url: 'https://www.na.org/meetingsearch' },
      { label: 'AA Meeting Finder', url: 'https://www.aa.org/find-aa' },
    ],
  },
  {
    id: 'food-banks',
    keywords: ['food bank', 'food pantry', 'free food', 'groceries', 'hungry', 'food distribution', 'meals'],
    title: 'Food Banks & Pantries',
    response: `**Food banks and pantries** provide free groceries — no documentation required at most locations.

**How to find food near you:**
- Call 211 or visit 211.org
- Use Feeding America's food bank locator
- Search "food pantry near me" for local options

**What to expect:**
- Most pantries operate on specific days/times
- No ID or proof of income usually required
- Some offer delivery for homebound individuals
- Many have culturally specific food options

**Additional meal programs:**
- School breakfast/lunch (free for qualifying families)
- Senior meal programs (Meals on Wheels)
- WIC for pregnant women and children under 5`,
    links: [
      { label: 'Find a food bank (Feeding America)', url: 'https://www.feedingamerica.org/find-your-local-foodbank' },
      { label: 'Find food via 211', url: 'https://www.211.org' },
      { label: 'WIC Program', url: 'https://www.fns.usda.gov/wic' },
      { label: 'Meals on Wheels', url: 'https://www.mealsonwheelsamerica.org' },
    ],
  },
  {
    id: '211',
    keywords: ['211', '2-1-1', 'general help', 'where to start', 'resources', 'social services', 'community resources', 'i need help'],
    title: 'Dial 211 — Your Starting Point',
    response: `**211** is the single best starting point when you're not sure where to begin. It connects people with local resources for virtually any need.

**How to use it:**
- Dial **2-1-1** from any phone
- Visit **211.org** online
- Text your zip code to 898-211

**What 211 connects you to:**
- Food, housing, and utility assistance
- Healthcare and mental health services
- Employment and education programs
- Childcare and family services
- Crisis intervention
- Veteran services
- Tax preparation assistance

**Available 24/7** in most areas, with multilingual support.`,
    links: [
      { label: '211.org — Find local help', url: 'https://www.211.org' },
      { label: 'California 211', url: 'https://www.211ca.org' },
    ],
  },
]

// Quick replies shown at the start of the chat
export const SUGGESTED_QUESTIONS = [
  'How do I apply for CalFresh?',
  'My client needs rental assistance',
  'Where to find free legal help?',
  'Mental health crisis resources',
  'Food banks near me',
  'Childcare assistance programs',
]
