import { useState, useEffect, useRef } from 'react'
import ResourceCard from './ResourceCard'
import Breadcrumb from '../../components/Breadcrumb'
import { matchResources } from '../../lib/claude-api'
import { DEMO_SCENARIO, SAMPLE_RESOURCES } from '../../data/sample-resources'
import { matchResourcesLocally } from '../../lib/local-resource-matcher'
import { useCaseSession } from '../../context/CaseContext'
import { buildNeedsSummary } from '../../lib/needs-extractor'

// Map resource type to form template ID
const TYPE_TO_FORM = {
  'Housing': 'erap',
  'Food Assistance': 'calfresh',
  'Healthcare': 'school-counseling',
  'Education': 'school-counseling',
  'Childcare': 'school-counseling',
}

export default function ResourceBrain({ onNavigate }) {
  const { caseSession, updateSession, addTimelineEvent } = useCaseSession()
  const [description, setDescription] = useState('')
  const [resources, setResources] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const hasAutoFilled = useRef(false)

  const isConnected = caseSession.connectedFrom === 'scribe' && caseSession.generatedNote
  const isFromScribe = caseSession.connectedFrom === 'scribe' || caseSession.connectedFrom === 'resources'

  // Auto-fill from Scribe context
  useEffect(() => {
    if (isConnected && !hasAutoFilled.current) {
      hasAutoFilled.current = true
      const summary = buildNeedsSummary(caseSession.extractedNeeds, caseSession.clientName)
      if (summary) {
        setDescription(summary)
      }
    }
  }, [isConnected, caseSession.extractedNeeds, caseSession.clientName])

  const handleSearch = async () => {
    setIsLoading(true)
    setResources(null)

    try {
      // Try Claude API first
      const result = await matchResources({ clientDescription: description })
      if (result && Array.isArray(result)) {
        setResources(result)
        updateSession({ matchedResources: result })
        addTimelineEvent({
          type: 'resources',
          label: `${result.length} resources matched`,
          detail: result[0]?.name || '',
          icon: 'resources',
        })
      } else {
        // No API — smart local matching based on description
        const localMatched = matchResourcesLocally(description)
        setResources(localMatched)
        updateSession({ matchedResources: localMatched })
        addTimelineEvent({
          type: 'resources',
          label: `${localMatched.length} resources matched`,
          detail: localMatched[0]?.name || '',
          icon: 'resources',
        })
      }
    } catch {
      const localMatched = matchResourcesLocally(description)
      setResources(localMatched)
      updateSession({ matchedResources: localMatched })
      addTimelineEvent({
        type: 'resources',
        label: `${localMatched.length} resources matched`,
        detail: localMatched[0]?.name || '',
        icon: 'resources',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrepareReferral = (resource) => {
    const formId = TYPE_TO_FORM[resource.type]
    updateSession({
      selectedResource: resource,
      connectedFrom: 'resources',
    })
    addTimelineEvent({
      type: `form-${formId || 'unknown'}`,
      label: `Referral prepared`,
      detail: resource.name,
      icon: 'form',
    })
    onNavigate?.('forms')
  }

  // Build breadcrumb trail
  const trail = isConnected ? ['scribe', 'resources'] : []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {trail.length > 0 && (
        <Breadcrumb trail={trail} current="resources" onNavigate={onNavigate} />
      )}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-serif">Resource Brain</h2>
            <p className="text-gray-500 text-sm">
              Describe a client's situation and find matching community resources instantly.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setDescription(DEMO_SCENARIO)}
            className="px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors cursor-pointer border border-brand-100"
          >
            Load Demo Scenario
          </button>
          <button
            onClick={handleSearch}
            disabled={!description.trim() || isLoading}
            className="px-6 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching...
              </span>
            ) : 'Find Resources'}
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the client's situation, needs, and any relevant details..."
          className="w-full h-40 p-4 border border-gray-200 rounded-2xl text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder:text-gray-400 shadow-sm"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-brand-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {resources && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            {resources.length} Resources Found
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map((resource, i) => (
              <ResourceCard
                key={i}
                resource={resource}
                showReferralButton={!!TYPE_TO_FORM[resource.type]}
                onPrepareReferral={handlePrepareReferral}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
