/**
 * Local resource matching — filters and ranks SAMPLE_RESOURCES
 * based on extracted needs from the client description.
 */

import { SAMPLE_RESOURCES } from '../data/sample-resources'

// Map text keywords to resource types
const KEYWORD_TO_TYPE = {
  // Housing
  rent: 'Housing',
  eviction: 'Housing',
  housing: 'Housing',
  homeless: 'Housing',
  shelter: 'Housing',
  landlord: 'Housing',
  apartment: 'Housing',
  // Food
  food: 'Food Assistance',
  meal: 'Food Assistance',
  hungry: 'Food Assistance',
  nutrition: 'Food Assistance',
  calfresh: 'Food Assistance',
  snap: 'Food Assistance',
  'food bank': 'Food Assistance',
  'food insecurity': 'Food Assistance',
  // Healthcare
  medical: 'Healthcare',
  medication: 'Healthcare',
  health: 'Healthcare',
  asthma: 'Healthcare',
  prescription: 'Healthcare',
  clinic: 'Healthcare',
  doctor: 'Healthcare',
  insurance: 'Healthcare',
  // Employment
  job: 'Employment',
  employment: 'Employment',
  career: 'Employment',
  unemployment: 'Employment',
  resume: 'Employment',
  'job search': 'Employment',
  work: 'Employment',
  // Mental Health
  counseling: 'Mental Health',
  depression: 'Mental Health',
  anxiety: 'Mental Health',
  'mental health': 'Mental Health',
  stress: 'Mental Health',
  therapy: 'Mental Health',
  emotional: 'Mental Health',
  // Legal
  legal: 'Legal Aid',
  'tenant rights': 'Legal Aid',
  court: 'Legal Aid',
  custody: 'Legal Aid',
  lawyer: 'Legal Aid',
  // Education
  school: 'Education',
  education: 'Education',
  tutoring: 'Education',
  // Childcare
  childcare: 'Childcare',
  daycare: 'Childcare',
  'child care': 'Childcare',
}

/**
 * Match resources locally based on a text description.
 * Returns a filtered + reranked subset of SAMPLE_RESOURCES.
 */
export function matchResourcesLocally(description) {
  if (!description || description.trim().length < 5) return SAMPLE_RESOURCES

  const lower = description.toLowerCase()

  // Find which resource types are relevant
  const matchedTypes = new Set()
  for (const [keyword, type] of Object.entries(KEYWORD_TO_TYPE)) {
    if (lower.includes(keyword)) {
      matchedTypes.add(type)
    }
  }

  // If no specific matches, return all resources
  if (matchedTypes.size === 0) return SAMPLE_RESOURCES

  // Score each resource
  const scored = SAMPLE_RESOURCES.map((resource) => {
    const isDirectMatch = matchedTypes.has(resource.type)
    // Boost score for direct matches, lower for others
    const adjustedScore = isDirectMatch
      ? Math.min(resource.matchScore + 5, 100)
      : Math.max(resource.matchScore - 20, 50)
    return { ...resource, matchScore: adjustedScore, _directMatch: isDirectMatch }
  })

  // Sort: direct matches first, then by score
  scored.sort((a, b) => {
    if (a._directMatch && !b._directMatch) return -1
    if (!a._directMatch && b._directMatch) return 1
    return b.matchScore - a.matchScore
  })

  // Clean up internal flag
  return scored.map(({ _directMatch, ...rest }) => rest)
}
