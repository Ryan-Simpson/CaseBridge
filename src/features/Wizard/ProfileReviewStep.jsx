import { useEffect, useRef, useState } from 'react'
import { useCaseSession } from '../../context/useCaseSession'
import { finalizeProfile } from '../../lib/llm-client'

export default function ProfileReviewStep() {
  const { caseSession, updateSession, setActiveStep, updateAgentStatus } = useCaseSession()
  const profile = caseSession.clientProfile
  // Start in the "normalizing" state when preconditions are met, so the
  // effect body doesn't need to call setState synchronously.
  const [isNormalizing, setIsNormalizing] = useState(
    () => !!(caseSession.sessionId && caseSession.clientProfile)
  )
  const [normalizeError, setNormalizeError] = useState(null)
  const finalizedRef = useRef(false)

  useEffect(() => {
    if (finalizedRef.current || !caseSession.sessionId || !profile) return
    finalizedRef.current = true
    // All state updates live inside Promise callbacks so the effect body
    // itself never calls setState synchronously.
    Promise.resolve()
      .then(() => {
        updateAgentStatus('profile', 'running')
        return finalizeProfile(caseSession.sessionId)
      })
      .then((normalized) => {
        updateSession({ clientProfile: normalized })
        updateAgentStatus('profile', 'done')
      })
      .catch((err) => {
        setNormalizeError(`Normalization failed: ${err.message}`)
        updateAgentStatus('profile', 'error')
      })
      .finally(() => {
        setIsNormalizing(false)
      })
  }, [caseSession.sessionId, profile, updateSession, updateAgentStatus])

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-amber-900">No profile yet</h2>
          <p className="text-sm text-amber-700 mt-2">
            Complete the intake interview first to build a client profile.
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-serif font-bold text-gray-900">Profile review</h2>
        <p className="text-sm text-gray-500 mt-1">
          Verify the facts captured from the interview. These feed eligibility screening
          and packet generation.
        </p>
        {isNormalizing && (
          <p className="text-xs text-brand-600 mt-2">Normalizing profile with Gemma…</p>
        )}
        {normalizeError && (
          <p className="text-xs text-amber-600 mt-2">{normalizeError}</p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
        <Section title="Identity">
          <Field label="Client name" value={profile.client_name} />
          <Field label="Date of birth" value={profile.date_of_birth} />
          <Field label="Preferred language" value={profile.preferred_language} />
        </Section>

        <Section title="Location">
          <Field label="Address" value={profile.address} />
          <Field label="City" value={profile.city} />
          <Field label="State" value={profile.state} />
          <Field label="ZIP" value={profile.zip_code} />
        </Section>

        <Section title="Contact">
          <Field label="Phone" value={profile.phone_number} />
          <Field label="Email" value={profile.email} />
        </Section>

        <Section title="Household">
          <Field label="Household size" value={profile.household_size} />
          {profile.household_members.length > 0 && (
            <div className="col-span-full mt-1">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Members
              </div>
              <ul className="space-y-1.5">
                {profile.household_members.map((m, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    <span className="font-medium">{m.name}</span>
                    {m.age != null && <span className="text-gray-500"> · age {m.age}</span>}
                    {m.relationship && <span className="text-gray-500"> · {m.relationship}</span>}
                    {m.student && <span className="ml-2 text-xs text-emerald-600">student</span>}
                    {m.disability && <span className="ml-2 text-xs text-amber-600">disability</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Finances">
          <Field label="Monthly income" value={formatCurrency(profile.monthly_income)} />
          <Field label="Monthly rent" value={formatCurrency(profile.monthly_rent)} />
          <Field label="Utility cost" value={formatCurrency(profile.utility_cost)} />
          {profile.income_sources.length > 0 && (
            <div className="col-span-full">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Income sources
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.income_sources.map((src, i) => (
                  <span key={i} className="rounded-full bg-brand-50 border border-brand-100 px-2 py-0.5 text-xs text-brand-700">
                    {src}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Needs">
          {profile.needs.length > 0 ? (
            <div className="col-span-full flex flex-wrap gap-1.5">
              {profile.needs.map((need) => (
                <span key={need} className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  {need}
                </span>
              ))}
            </div>
          ) : (
            <Field label="" value={null} />
          )}
        </Section>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setActiveStep('intake')}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          ← Back to intake
        </button>
        <button
          onClick={() => setActiveStep('eligibility')}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors cursor-pointer"
        >
          Continue to eligibility →
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="px-5 py-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value }) {
  const display = value == null || value === '' ? '—' : String(value)
  const isEmpty = display === '—'
  return (
    <div>
      {label && <div className="text-xs text-gray-400 mb-0.5">{label}</div>}
      <div className={`text-sm ${isEmpty ? 'text-gray-300 italic' : 'text-gray-800'}`}>{display}</div>
    </div>
  )
}

function formatCurrency(value) {
  if (value == null || value === '') return null
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num)
}
