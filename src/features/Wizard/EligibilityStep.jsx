import { useEffect, useRef, useState } from 'react'
import { useCaseSession } from '../../context/useCaseSession'
import { screenEligibility } from '../../lib/llm-client'
import { PROGRAM_ICONS, PROGRAM_NAMES } from '../../lib/programs'

export default function EligibilityStep() {
  const { caseSession, updateSession, setActiveStep, updateAgentStatus } = useCaseSession()
  const profile = caseSession.clientProfile
  const [isLoading, setIsLoading] = useState(() => !caseSession.eligibility?.length)
  const [error, setError] = useState(null)
  const screenedRef = useRef(false)

  useEffect(() => {
    if (screenedRef.current || !profile) return
    if (caseSession.eligibility?.length > 0) return
    screenedRef.current = true
    Promise.resolve()
      .then(() => {
        updateAgentStatus('eligibility', 'running')
        return screenEligibility(profile)
      })
      .then((results) => {
        updateSession({ eligibility: results })
        updateAgentStatus('eligibility', 'done')
      })
      .catch((err) => {
        setError(`Eligibility screen failed: ${err.message}`)
        updateAgentStatus('eligibility', 'error')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [profile, caseSession.eligibility, updateSession, updateAgentStatus])

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-amber-900">No profile yet</h2>
          <p className="text-sm text-amber-700 mt-2">
            Complete the intake interview first.
          </p>
          <button
            onClick={() => setActiveStep('intake')}
            className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors cursor-pointer"
          >
            Back to intake
          </button>
        </div>
      </div>
    )
  }

  const results = caseSession.eligibility || []
  const eligibleCount = results.filter((r) => r.eligible).length

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Eligibility</h2>
          <p className="text-sm text-gray-500 mt-1">
            Deterministic rules evaluated against {profile.client_name || 'the client'}'s profile.
          </p>
        </div>
        {!isLoading && results.length > 0 && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">
            {eligibleCount} of {results.length} eligible
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Evaluating rules…
        </div>
      )}

      {!isLoading && results.length === 0 && !error && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          No rules loaded.
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <ProgramCard key={result.program_id} result={result} />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setActiveStep('profile')}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          ← Back to profile
        </button>
        <button
          onClick={() => setActiveStep('packet')}
          disabled={eligibleCount === 0}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Continue to packet →
        </button>
      </div>
    </div>
  )
}

function ProgramCard({ result }) {
  const eligible = result.eligible
  const icon = PROGRAM_ICONS[result.program_id] || '📋'
  const name = PROGRAM_NAMES[result.program_id] || result.program_id

  return (
    <div
      className={`rounded-2xl border p-5 ${
        eligible
          ? 'border-emerald-200 bg-emerald-50/40'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0" aria-hidden>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                eligible
                  ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                  : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}
            >
              {eligible ? 'Eligible' : 'Not eligible'}
            </span>
          </div>
          <ul className="space-y-1">
            {result.reasons.map((reason, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className={`mt-0.5 flex-shrink-0 ${eligible ? 'text-emerald-500' : 'text-gray-400'}`}>
                  {eligible ? '✓' : '·'}
                </span>
                {reason}
              </li>
            ))}
          </ul>
          {result.missing_fields?.length > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              Missing: {result.missing_fields.join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
