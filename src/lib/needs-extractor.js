const NEED_KEYWORDS = {
  housing: ['rent', 'eviction', 'housing', 'shelter', 'homeless', 'landlord', 'tenant', 'rental assistance', 'ERAP'],
  food: ['food', 'meal', 'nutrition', 'CalFresh', 'hungry', 'food bank', 'food insecurity', 'skipping meals'],
  healthcare: ['medication', 'medical', 'asthma', 'health', 'pharmacy', 'Medi-Cal', 'prescription', 'clinic'],
  employment: ['job', 'employment', 'workforce', 'career', 'unemployment', 'job loss', 'resume'],
  mental_health: ['counseling', 'depression', 'anxiety', 'mental health', 'support group', 'emotional', 'therapy', 'crisis'],
  legal: ['legal', 'tenant rights', 'eviction proceedings', 'court', 'legal aid'],
  childcare: ['childcare', 'child care', 'daycare', 'after-school'],
  education: ['education', 'school counseling', 'tutoring', 'school enrollment', 'free lunch', 'reduced lunch'],
}

const NEED_LABELS = {
  housing: 'Housing Assistance',
  food: 'Food & Nutrition',
  healthcare: 'Healthcare Access',
  employment: 'Employment Support',
  mental_health: 'Mental Health Services',
  legal: 'Legal Aid',
  childcare: 'Childcare Support',
  education: 'Education Services',
}

export function extractNeeds(noteText) {
  if (!noteText) return []

  const lowerText = noteText.toLowerCase()
  const needs = []

  for (const [category, keywords] of Object.entries(NEED_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        needs.push(category)
        break
      }
    }
  }

  return needs
}

export function getNeedLabel(need) {
  return NEED_LABELS[need] || need
}

export function extractClientName(noteText) {
  if (!noteText) return ''

  // Try common patterns in case notes — full name first, then first name only
  const patterns = [
    // Full name patterns (first + last)
    /(?:Client|Tenant|Patient|Applicant)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:attended|reported|presented|is a)/,
    /(?:Name|Client Name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    // First name only patterns
    /(?:Client|Tenant|Patient|Applicant)\s+([A-Z][a-z]{2,})\s+(?:reports?|attended|presented|stated|described|shared|expressed|disclosed|indicated)/,
    /([A-Z][a-z]{2,})\s+(?:attended|reported|presented|is a|participated|engaged)/,
    // From transcript greeting patterns
    /(?:Good morning|Good afternoon|Hello|Hi),?\s+([A-Z][a-z]{2,})/,
    /(?:morning|afternoon|evening),?\s+([A-Z][a-z]{2,})/,
    /(?:Thanks for coming|Thank you),?\s+([A-Z][a-z]{2,})/,
  ]

  for (const pattern of patterns) {
    const match = noteText.match(pattern)
    if (match) return match[1]
  }

  return ''
}

export function buildNeedsSummary(needs, clientName) {
  if (needs.length === 0) return ''

  const labels = needs.map((n) => getNeedLabel(n))
  const name = clientName || 'Client'
  return `${name} needs support with: ${labels.join(', ')}. Please find matching community resources for these needs.`
}
