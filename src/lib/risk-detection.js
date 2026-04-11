const RED_KEYWORDS = {
  'eviction': {
    category: 'Housing Instability',
    recommendation: 'Immediate housing referral and tenant rights consultation needed',
  },
  'homelessness': {
    category: 'Homelessness Risk',
    recommendation: 'Connect to emergency shelter and housing assistance programs',
  },
  'homeless': {
    category: 'Homelessness Risk',
    recommendation: 'Connect to emergency shelter and housing assistance programs',
  },
  'abuse': {
    category: 'Abuse Concern',
    recommendation: 'Assess safety; consider mandatory reporting obligations',
  },
  'domestic violence': {
    category: 'Domestic Violence',
    recommendation: 'Safety planning required; refer to DV hotline and shelter',
  },
  'substance abuse': {
    category: 'Substance Abuse',
    recommendation: 'Refer to substance abuse treatment and support services',
  },
  'suicidal ideation': {
    category: 'Suicidal Ideation',
    recommendation: 'Immediate risk assessment; provide crisis hotline (988)',
  },
  'suicidal': {
    category: 'Suicidal Ideation',
    recommendation: 'Immediate risk assessment; provide crisis hotline (988)',
  },
  'self-harm': {
    category: 'Self-Harm Risk',
    recommendation: 'Safety assessment and mental health crisis intervention',
  },
}

const AMBER_KEYWORDS = {
  'financial instability': {
    category: 'Financial Instability',
    recommendation: 'Screen for emergency assistance and benefits eligibility',
  },
  'financial crisis': {
    category: 'Financial Crisis',
    recommendation: 'Urgent financial counseling and emergency fund referral',
  },
  'financial distress': {
    category: 'Financial Distress',
    recommendation: 'Screen for emergency assistance and benefits eligibility',
  },
  'job loss': {
    category: 'Job Loss',
    recommendation: 'Connect to workforce development and unemployment benefits',
  },
  'unemployment': {
    category: 'Unemployment',
    recommendation: 'Refer to employment services and job training programs',
  },
  'food insecurity': {
    category: 'Food Insecurity',
    recommendation: 'Refer to food banks, CalFresh, and meal programs',
  },
  'food bank': {
    category: 'Food Insecurity',
    recommendation: 'Ensure client has access to consistent food resources',
  },
  'skipping meals': {
    category: 'Food Insecurity',
    recommendation: 'Urgent nutrition support needed; screen for CalFresh',
  },
  'child behavioral': {
    category: 'Child Behavioral Concerns',
    recommendation: 'Refer to school counselor and family therapy services',
  },
  'loss of support': {
    category: 'Support System Loss',
    recommendation: 'Connect to peer support groups and community resources',
  },
  'housing instability': {
    category: 'Housing Instability',
    recommendation: 'Refer to rental assistance and housing stabilization programs',
  },
  'housing loss': {
    category: 'Housing Instability',
    recommendation: 'Urgent housing intervention needed',
  },
}

const NEGATION_PATTERN = /\b(no|not|denies|denied|without|never|absence of|negative for)\b/i

function isNegated(text, matchIndex, keyword) {
  const windowStart = Math.max(0, matchIndex - 40)
  const before = text.slice(windowStart, matchIndex)
  return NEGATION_PATTERN.test(before)
}

export function detectRisks(noteText) {
  if (!noteText) return { flags: [], summary: { red: 0, amber: 0, total: 0 } }

  const flags = []
  const seenCategories = new Set()
  const lowerText = noteText.toLowerCase()

  // Process RED keywords first (higher priority)
  for (const [keyword, meta] of Object.entries(RED_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    let match
    while ((match = regex.exec(noteText)) !== null) {
      if (seenCategories.has(meta.category)) continue
      if (isNegated(noteText, match.index, keyword)) continue

      seenCategories.add(meta.category)
      flags.push({
        keyword: match[0],
        severity: 'red',
        category: meta.category,
        recommendation: meta.recommendation,
        index: match.index,
        length: match[0].length,
      })
    }
  }

  // Process AMBER keywords
  for (const [keyword, meta] of Object.entries(AMBER_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    let match
    while ((match = regex.exec(noteText)) !== null) {
      if (seenCategories.has(meta.category)) continue
      if (isNegated(noteText, match.index, keyword)) continue

      seenCategories.add(meta.category)
      flags.push({
        keyword: match[0],
        severity: 'amber',
        category: meta.category,
        recommendation: meta.recommendation,
        index: match.index,
        length: match[0].length,
      })
    }
  }

  // Sort: red first, then amber
  flags.sort((a, b) => {
    if (a.severity === b.severity) return a.index - b.index
    return a.severity === 'red' ? -1 : 1
  })

  const red = flags.filter((f) => f.severity === 'red').length
  const amber = flags.filter((f) => f.severity === 'amber').length

  return { flags, summary: { red, amber, total: red + amber } }
}
