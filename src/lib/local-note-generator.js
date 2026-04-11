/**
 * Local case note generator — works without Claude API.
 * Parses the transcript and builds structured notes from actual content.
 */

// Extract speaker turns from transcript
function parseTurns(transcript) {
  const lines = transcript.split('\n').filter((l) => l.trim())
  const turns = []
  let current = null

  for (const line of lines) {
    // Match patterns like "Caseworker:", "Client:", "SW:", "CW:", "Worker:", "Therapist:", etc.
    const speakerMatch = line.match(
      /^(Caseworker|Client|Patient|Worker|Social Worker|SW|CW|Therapist|Counselor|Clinician|Provider|Staff|Interviewer|Participant)[:\s-]+(.+)/i
    )
    if (speakerMatch) {
      const role = speakerMatch[1].toLowerCase()
      const isClient =
        role === 'client' || role === 'patient' || role === 'participant'
      current = { isClient, text: speakerMatch[2].trim() }
      turns.push(current)
    } else if (current) {
      current.text += ' ' + line.trim()
    } else {
      // No speaker label — treat as general content
      turns.push({ isClient: false, text: line.trim() })
    }
  }

  return turns
}

// Extract key details from transcript text
function extractDetails(transcript) {
  const lower = transcript.toLowerCase()
  const turns = parseTurns(transcript)
  const clientTurns = turns.filter((t) => t.isClient).map((t) => t.text)
  const workerTurns = turns.filter((t) => !t.isClient).map((t) => t.text)
  const clientText = clientTurns.join(' ')
  const allText = transcript

  // Extract client name from worker addressing them
  let clientName = ''
  const namePatterns = [
    /(?:Good morning|Good afternoon|Hello|Hi),?\s+([A-Z][a-z]+)/,
    /(?:Thanks for coming|Thank you),?\s+([A-Z][a-z]+)/,
    /(?:morning|afternoon|evening),?\s+([A-Z][a-z]+)/,
    /(?:Client|Patient|Name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /(?:Client|Tenant|Patient|Applicant)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:attended|reported|presented|is a)/,
  ]
  for (const p of namePatterns) {
    const m = allText.match(p)
    if (m) {
      clientName = m[1]
      break
    }
  }

  // Gather client-reported concerns
  const concerns = clientTurns.slice(0, 6).filter((t) => t.length > 20)

  // Gather worker observations
  const observations = workerTurns.filter((t) => t.length > 20)

  // Detect topics
  const topics = []
  const topicMap = {
    housing: ['rent', 'eviction', 'housing', 'landlord', 'homeless', 'shelter', 'apartment'],
    financial: ['money', 'income', 'financial', 'bills', 'debt', 'afford', 'pay', 'budget', 'job loss', 'unemployment'],
    food: ['food', 'meal', 'hungry', 'nutrition', 'eat', 'skipping meals', 'food bank', 'CalFresh'],
    healthcare: ['medication', 'medical', 'health', 'doctor', 'clinic', 'hospital', 'prescription', 'asthma', 'diagnosis'],
    mental_health: ['anxiety', 'depression', 'stress', 'crying', 'sleep', 'emotional', 'overwhelmed', 'feeling', 'therapy', 'counseling'],
    employment: ['job', 'work', 'employment', 'career', 'applying', 'resume', 'interview', 'fired', 'laid off'],
    education: ['school', 'education', 'grades', 'teacher', 'learning', 'student'],
    family: ['children', 'kids', 'family', 'spouse', 'partner', 'parent', 'daughter', 'son', 'baby'],
    legal: ['legal', 'court', 'arrest', 'custody', 'probation', 'lawyer', 'rights'],
    substance: ['substance', 'alcohol', 'drug', 'addiction', 'recovery', 'sober', 'drinking'],
    domestic_violence: ['abuse', 'violence', 'safety', 'protective order', 'restraining'],
    childcare: ['childcare', 'daycare', 'babysitter', 'after-school'],
  }

  for (const [topic, keywords] of Object.entries(topicMap)) {
    if (keywords.some((k) => lower.includes(k))) {
      topics.push(topic)
    }
  }

  return { clientName, concerns, observations, topics, clientText, allText, turns }
}

// Build a bullet list of key points from text
function summarizePoints(texts, max = 5) {
  return texts
    .slice(0, max)
    .map((t) => {
      // Truncate long turns
      const clean = t.length > 300 ? t.substring(0, 297) + '...' : t
      return clean
    })
}

// Get topic descriptions for the plan section
function getTopicActions(topics) {
  const actions = {
    housing: 'Explore emergency rental/housing assistance programs. Provide tenant rights information if applicable.',
    financial: 'Review income sources and assist with benefits applications. Connect with financial counseling services.',
    food: 'Assist with CalFresh/SNAP application. Identify local food banks and meal programs with accessible hours.',
    healthcare: 'Connect with community health center or sliding-scale clinic. Explore Medi-Cal/insurance eligibility. Address medication access.',
    mental_health: 'Monitor emotional wellbeing. Discuss coping strategies and self-care. Consider referral to counseling or support group.',
    employment: 'Review job search strategies. Connect with workforce development programs and career services.',
    education: 'Coordinate with school counselor or educational support services. Explore tutoring or academic assistance programs.',
    family: 'Assess family dynamics and support systems. Provide parenting resources if appropriate.',
    legal: 'Refer to legal aid services for consultation. Provide information about relevant rights and processes.',
    substance: 'Discuss treatment options. Provide referrals to substance abuse programs and support groups.',
    domestic_violence: 'Conduct safety assessment. Provide crisis hotline information. Connect with DV shelter/advocacy services.',
    childcare: 'Explore childcare assistance programs and subsidies. Identify after-school program options.',
  }
  return topics.map((t) => actions[t]).filter(Boolean)
}

function getTopicLabel(topic) {
  const labels = {
    housing: 'Housing',
    financial: 'Financial Stability',
    food: 'Food Security',
    healthcare: 'Healthcare',
    mental_health: 'Mental Health',
    employment: 'Employment',
    education: 'Education',
    family: 'Family Support',
    legal: 'Legal',
    substance: 'Substance Use',
    domestic_violence: 'Safety',
    childcare: 'Childcare',
  }
  return labels[topic] || topic
}

// ─── SOAP ────────────────────────────────────────────
function generateSOAP(details) {
  const { clientName, concerns, observations, topics } = details
  const name = clientName || 'Client'

  const subjective = concerns.length > 0
    ? `${name} reports the following concerns during today's session:\n${summarizePoints(concerns).map((c) => `- ${c}`).join('\n')}`
    : `${name} participated in today's session and discussed current life circumstances and challenges.`

  const objective = observations.length > 0
    ? `${name} presented to session and was cooperative and engaged throughout. Key observations:\n${summarizePoints(observations, 3).map((o) => `- Caseworker noted: ${o}`).join('\n')}\n${name} demonstrated willingness to engage with recommended services and resources.`
    : `${name} presented to session on time, was cooperative, and engaged throughout the discussion. Affect was appropriate to content discussed. ${name} demonstrated motivation to address current challenges.`

  const topicList = topics.length > 0
    ? topics.map((t) => getTopicLabel(t)).join(', ')
    : 'general life stressors'
  const assessment = `${name} is currently managing challenges related to ${topicList}. ${topics.length > 1 ? 'The convergence of multiple stressors elevates the need for coordinated intervention across service areas.' : 'Continued support and monitoring is warranted.'} Protective factors include engagement with services and willingness to accept support. ${topics.some((t) => ['housing', 'domestic_violence', 'substance'].includes(t)) ? 'Timely intervention is recommended to prevent escalation.' : 'Prognosis is positive with appropriate resource connections.'}`

  const actions = getTopicActions(topics)
  const plan = actions.length > 0
    ? actions.map((a, i) => `${i + 1}. **${getTopicLabel(topics[i])}:** ${a}`).join('\n')
    : `1. Continue to assess and monitor client needs.\n2. Explore relevant resource referrals based on identified concerns.\n3. Schedule follow-up session within two weeks.`

  return `**SUBJECTIVE (S):**\n${subjective}\n\n**OBJECTIVE (O):**\n${objective}\n\n**ASSESSMENT (A):**\n${assessment}\n\n**PLAN (P):**\n${plan}\n${actions.length > 0 ? `${actions.length + 1}. **Follow-up:** Schedule next session within two weeks to assess progress on interventions.` : ''}`
}

// ─── DAP ─────────────────────────────────────────────
function generateDAP(details) {
  const { clientName, concerns, observations, topics } = details
  const name = clientName || 'Client'

  const allPoints = [...concerns, ...observations.slice(0, 2)]
  const data = allPoints.length > 0
    ? `${name} attended today's session. The following information was gathered:\n${summarizePoints(allPoints, 6).map((p) => `- ${p}`).join('\n')}`
    : `${name} attended today's session and discussed current circumstances. Client was cooperative and engaged in the conversation.`

  const topicList = topics.length > 0
    ? topics.map((t) => getTopicLabel(t)).join(', ')
    : 'current life circumstances'
  const assessment = `${name} is managing challenges related to ${topicList}. ${topics.length > 2 ? 'Multiple intersecting needs indicate the value of a coordinated multi-service approach.' : 'Focused intervention on identified needs is recommended.'} ${name} demonstrates engagement with services and motivation to address current situation. Continued monitoring and support is warranted.`

  const actions = getTopicActions(topics)
  const plan = actions.length > 0
    ? actions.map((a, i) => `${i + 1}. ${a}`).join('\n')
    : `1. Continue to assess client needs and identify appropriate resources.\n2. Monitor progress and wellbeing at next session.\n3. Follow up in 10-14 days.`

  return `**DATA (D):**\n${data}\n\n**ASSESSMENT (A):**\n${assessment}\n\n**PLAN (P):**\n${plan}`
}

// ─── Narrative ───────────────────────────────────────
function generateNarrative(details) {
  const { clientName, concerns, topics, turns } = details
  const name = clientName || 'The client'

  const topicList = topics.length > 0
    ? topics.map((t) => getTopicLabel(t).toLowerCase()).join(', ')
    : 'current life circumstances'

  const para1 = `${name} attended today's scheduled session to discuss ${topicList}. ${name} was cooperative and engaged throughout the meeting.`

  let para2
  if (concerns.length > 0) {
    const keyPoints = summarizePoints(concerns, 3)
    para2 = `During the session, ${name} shared the following: ${keyPoints.map((p) => `${name} reported that ${p.charAt(0).toLowerCase() + p.slice(1)}${p.endsWith('.') ? '' : '.'}`).join(' ')}`
  } else if (turns.length > 0) {
    para2 = `The session covered several areas of concern. ${name} participated actively in the discussion and provided relevant information about their current situation.`
  } else {
    para2 = `${name} discussed their current circumstances and the challenges they are facing. The conversation covered multiple areas of need.`
  }

  const actions = getTopicActions(topics)
  const para3 = actions.length > 0
    ? `Based on the session, a plan was developed to address identified needs: ${actions.join(' ')} A follow-up session is scheduled within two weeks to assess progress.`
    : `The session focused on building rapport and assessing ${name}'s current needs. Next steps include identifying appropriate resources and scheduling a follow-up within two weeks to monitor progress.`

  return `${para1}\n\n${para2}\n\n${para3}`
}

/**
 * Generate a case note locally from a transcript.
 * Returns a formatted note string or null if transcript is too short.
 */
export function generateLocalNote({ transcript, format = 'SOAP' }) {
  if (!transcript || transcript.trim().length < 20) return null

  const details = extractDetails(transcript)

  switch (format) {
    case 'DAP':
      return generateDAP(details)
    case 'Narrative':
      return generateNarrative(details)
    case 'SOAP':
    default:
      return generateSOAP(details)
  }
}

/**
 * Extract client name from raw transcript text
 */
export function extractClientNameFromTranscript(transcript) {
  if (!transcript) return ''
  const details = extractDetails(transcript)
  return details.clientName
}
