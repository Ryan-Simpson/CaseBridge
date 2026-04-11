/**
 * Dynamic form field generator — fills form templates from session context
 * instead of hardcoded demo data.
 */

import { FORM_TEMPLATES } from '../data/form-templates'
import { getNeedLabel } from './needs-extractor'

/**
 * Build form templates dynamically from session data.
 * When we have context (client name, needs, transcript), populate fields with that data.
 * When we don't, show placeholder instructions.
 */
export function buildDynamicForms({ clientName, extractedNeeds, generatedNote, transcript }) {
  const name = clientName || ''
  const hasContext = !!(name || (extractedNeeds && extractedNeeds.length > 0) || generatedNote)
  const today = new Date().toLocaleDateString('en-US')

  // Extract some info from the note/transcript if available
  const noteInfo = hasContext ? extractNoteDetails(generatedNote || transcript || '') : {}

  return [
    buildCalFreshForm({ name, hasContext, today, noteInfo, extractedNeeds }),
    buildERAPForm({ name, hasContext, today, noteInfo, extractedNeeds }),
    buildSchoolCounselingForm({ name, hasContext, today, noteInfo, extractedNeeds }),
  ]
}

function extractNoteDetails(text) {
  if (!text) return {}
  const lower = text.toLowerCase()

  const info = {}

  // Try to extract household info — multiple patterns
  if (/(?:three|3)\s*(?:children|kids)/i.test(text)) {
    info.childCount = 3
  } else if (/(?:two|2)\s*(?:children|kids)/i.test(text)) {
    info.childCount = 2
  } else if (/(?:four|4)\s*(?:children|kids)/i.test(text)) {
    info.childCount = 4
  } else if (/(?:one|1)\s*(?:child|kid)/i.test(text)) {
    info.childCount = 1
  } else {
    const householdMatch = text.match(/(\d+)\s*(?:children|kids|child|minor)/i)
    if (householdMatch) info.childCount = parseInt(householdMatch[1])
  }

  // Adults count
  if (lower.includes('wife') || lower.includes('husband') || lower.includes('spouse') || lower.includes('partner')) {
    info.adultCount = 2
  } else {
    info.adultCount = 1
  }

  // Rent amount — look specifically for rent
  const rentPatterns = [
    /rent\s+(?:is|of|about|around|was|costs?)?\s*\$([\d,]+)/i,
    /\$([\d,]+)\s*(?:rent|monthly rent|in rent|for rent)/i,
    /rent[^.]{0,30}?\$([\d,]+)/i,
  ]
  for (const p of rentPatterns) {
    const m = text.match(p)
    if (m) { info.rentRef = '$' + m[1]; break }
  }

  // Income references — look for income, not savings
  const incomePatterns = [
    /(?:income|earning|making|salary|wages?|brings?\s+in)\s*(?:is|of|about|around|approximately)?\s*\$([\d,]+)/i,
    /\$([\d,]+)\s*(?:per month|monthly|\/month|a month|income)/i,
    /(?:unemployment|UI|benefits)\s*(?:is|of|about|around|covers?)?\s*\$([\d,]+)/i,
  ]
  for (const p of incomePatterns) {
    const m = text.match(p)
    if (m) { info.incomeRef = '$' + m[1]; break }
  }
  if (!info.incomeRef && (lower.includes('unemployment') || lower.includes('benefits'))) {
    info.incomeRef = 'Unemployment Benefits — amount TBD'
  }

  // Employment info
  if (lower.includes('unemploy') || lower.includes('job loss') || lower.includes('laid off') ||
      lower.includes('lost my job') || lower.includes('got fired') || lower.includes('let go') ||
      lower.includes('lost her job') || lower.includes('lost his job')) {
    info.employmentStatus = 'Unemployed'
  }
  if (lower.includes('unemployment benefits') || lower.includes('unemployment insurance') ||
      lower.includes('applied for unemployment')) {
    info.hasUnemployment = true
  }

  // Children names — multiple patterns
  const childNames = new Set()
  const childNamePatterns = [
    /(?:daughter|son|child|baby)\s+([A-Z][a-z]+)/g,
    /([A-Z][a-z]+)\s+is\s+\d+/g,
    /([A-Z][a-z]+)\s*(?:,\s*|\()\s*(?:age\s*)?\d+/g,
  ]
  const skipNames = new Set(['Client', 'Worker', 'The', 'She', 'He', 'They', 'This', 'That',
    'Not', 'Yes', 'Mon', 'Tue', 'Wed', 'Caseworker', 'Social', 'Good', 'Thank'])
  for (const p of childNamePatterns) {
    let m
    while ((m = p.exec(text)) !== null) {
      const name = m[1]
      if (!skipNames.has(name)) childNames.add(name)
    }
  }
  if (childNames.size > 0) info.childNames = Array.from(childNames)

  return info
}

function buildCalFreshForm({ name, hasContext, today, noteInfo }) {
  const placeholder = '[To be completed]'
  const fields = [
    { label: 'Applicant Name', value: name || placeholder },
    { label: 'Date of Birth', value: placeholder },
    { label: 'Home Address', value: placeholder },
    { label: 'Phone Number', value: placeholder },
    { label: 'Email Address', value: placeholder },
    {
      label: 'Household Size',
      value: noteInfo.childCount
        ? `${(noteInfo.adultCount || 1) + noteInfo.childCount} (${noteInfo.adultCount || 1} ${(noteInfo.adultCount || 1) === 1 ? 'adult' : 'adults'}, ${noteInfo.childCount} ${noteInfo.childCount === 1 ? 'child' : 'children'})`
        : placeholder,
    },
    {
      label: 'Monthly Gross Income',
      value: noteInfo.incomeRef || (noteInfo.hasUnemployment ? 'Unemployment Benefits — amount pending' : placeholder),
    },
    {
      label: 'Employment Status',
      value: noteInfo.employmentStatus || placeholder,
    },
    {
      label: 'Monthly Rent/Mortgage',
      value: noteInfo.rentRef || placeholder,
    },
    { label: 'Other Income Sources', value: placeholder },
    { label: 'Citizenship Status', value: placeholder },
    {
      label: 'Expedited Service Needed',
      value: hasContext ? 'To be determined based on income verification' : placeholder,
    },
    { label: 'Referring Caseworker', value: placeholder },
    { label: 'Application Date', value: today },
  ]

  return {
    id: 'calfresh',
    name: 'CalFresh Application',
    icon: '\uD83D\uDED2',
    description: 'Supplemental Nutrition Assistance Program',
    fields,
  }
}

function buildERAPForm({ name, hasContext, today, noteInfo }) {
  const placeholder = '[To be completed]'
  const fields = [
    { label: 'Tenant Name', value: name || placeholder },
    { label: 'Tenant Phone', value: placeholder },
    { label: 'Tenant Email', value: placeholder },
    { label: 'Rental Address', value: placeholder },
    { label: 'Landlord Name', value: placeholder },
    { label: 'Landlord Contact', value: placeholder },
    {
      label: 'Monthly Rent Amount',
      value: noteInfo.rentRef || placeholder,
    },
    { label: 'Amount Past Due', value: placeholder },
    { label: 'Months Behind', value: placeholder },
    { label: 'Eviction Notice Received', value: placeholder },
    {
      label: 'Reason for Hardship',
      value: noteInfo.employmentStatus === 'Unemployed' ? 'Involuntary job loss' : placeholder,
    },
    {
      label: 'Current Monthly Income',
      value: noteInfo.incomeRef || (noteInfo.hasUnemployment ? 'Unemployment Insurance' : placeholder),
    },
    {
      label: 'Household Size',
      value: noteInfo.childCount
        ? `${(noteInfo.adultCount || 1) + noteInfo.childCount} (${noteInfo.adultCount || 1} ${(noteInfo.adultCount || 1) === 1 ? 'adult' : 'adults'}, ${noteInfo.childCount} minor ${noteInfo.childCount === 1 ? 'child' : 'children'})`
        : placeholder,
    },
    { label: 'Assistance Requested', value: hasContext ? 'Rent payment assistance' : placeholder },
    { label: 'Referring Caseworker', value: placeholder },
    { label: 'Referral Date', value: today },
  ]

  return {
    id: 'erap',
    name: 'ERAP Referral',
    icon: '\uD83C\uDFE0',
    description: 'Emergency Rental Assistance Program',
    fields,
  }
}

function buildSchoolCounselingForm({ name, hasContext, today, noteInfo }) {
  const placeholder = '[To be completed]'
  const studentName = noteInfo.childNames?.[0] || placeholder

  const fields = [
    { label: 'Student Name', value: studentName },
    { label: 'Date of Birth', value: placeholder },
    { label: 'Grade Level', value: placeholder },
    { label: 'School Name', value: placeholder },
    { label: 'Parent/Guardian Name', value: name || placeholder },
    { label: 'Parent Phone', value: placeholder },
    { label: 'Parent Email', value: placeholder },
    { label: 'Home Address', value: placeholder },
    {
      label: 'Reason for Referral',
      value: hasContext
        ? 'Family experiencing challenges. Student may benefit from school-based support services.'
        : placeholder,
    },
    { label: 'Presenting Concerns', value: placeholder },
    { label: 'Medical Considerations', value: placeholder },
    {
      label: 'Services Requested',
      value: hasContext ? 'Counseling, free/reduced lunch enrollment, additional support as needed' : placeholder,
    },
    { label: 'Free/Reduced Lunch Eligible', value: hasContext ? 'To be determined' : placeholder },
    { label: 'Referring Professional', value: placeholder },
    { label: 'Referral Date', value: today },
  ]

  return {
    id: 'school-counseling',
    name: 'School Counseling Request',
    icon: '\uD83C\uDF93',
    description: 'Student Support Services Referral',
    fields,
  }
}

/**
 * Get the static demo templates (original hardcoded data)
 * Used when "Load Demo" is active
 */
export function getDemoForms() {
  return FORM_TEMPLATES
}
