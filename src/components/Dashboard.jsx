import { useState, useEffect, useRef } from 'react'
import { useCaseSession } from '../context/useCaseSession'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const RISK_LABELS = {
  high: { text: 'High', color: 'text-red-600 bg-red-50 border-red-200' },
  medium: { text: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  low: { text: 'Low', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  none: { text: 'None', color: 'text-gray-500 bg-gray-50 border-gray-200' },
}

const STATUS_DOT = {
  'Active': 'bg-blue-500',
  'Follow-up': 'bg-amber-500',
  'Closed': 'bg-gray-400',
}

// Animated counter hook
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()
          const tick = (now) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { value, ref }
}

function StatCard({ number, label, suffix = '', icon }) {
  const { value, ref } = useCountUp(number)
  return (
    <div ref={ref} className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl font-bold text-gray-900 tabular-nums">
            {value}{suffix}
          </div>
          <div className="text-sm text-gray-500 mt-1">{label}</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  )
}

// Add Client modal
function AddClientModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState('Active')
  const [risk, setRisk] = useState('low')
  const [transcript, setTranscript] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      clientName: name.trim(),
      summary: summary.trim() || 'New client intake',
      status,
      riskLevel: risk,
      transcript: transcript.trim() || '',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 font-serif">Add New Client</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Client Name *</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maria Santos"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Summary</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g. Housing instability, food insecurity"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Active">Active</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Risk Level</label>
            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Session Notes / Transcript <span className="text-gray-400 font-normal normal-case">(optional — paste or type)</span>
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste session transcript or type notes here..."
            className="w-full h-28 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            Add Client
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Dashboard({ onStartWizard }) {
  const { clearSession, updateSession, cases, archivedCases, addCase, archiveCase, restoreCase } = useCaseSession()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const handleCaseClick = (caseData) => {
    clearSession()
    updateSession({
      preloadedTranscript: caseData.transcript || '',
      preloadedClientName: caseData.clientName,
    })
    onStartWizard()
  }

  const handleArchive = (e, caseId) => {
    e.stopPropagation()
    archiveCase(caseId)
  }

  const handleRestore = (caseId) => {
    restoreCase(caseId)
  }

  const activeCases = cases.filter(c => c.status !== 'Closed')
  const followUps = cases.filter(c => c.status === 'Follow-up')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Hero greeting area */}
      <div className="mb-10">
        <p className="text-sm font-medium text-brand-600 mb-1">CaseBridge AI</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-serif leading-tight">
          {getGreeting()}.
        </h1>
        <p className="text-gray-500 mt-2 text-base max-w-xl">
          You have <span className="text-gray-900 font-semibold">{activeCases.length} active case{activeCases.length !== 1 ? 's' : ''}</span> today.
          Pick up where you left off, or start a new session.
        </p>
      </div>

      {/* Start new session CTA */}
      <div className="mb-10 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Start a new session</h2>
          <p className="text-blue-100 text-sm sm:text-base mb-5 max-w-lg">
            Record a client meeting, generate a case note, match resources, and fill referral forms — all in one flow.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onStartWizard}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold text-sm rounded-lg hover:bg-blue-50 transition-colors cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Case
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-10">
        <StatCard
          number={activeCases.length}
          label="Active Cases"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatCard
          number={followUps.length}
          label="Follow-ups Due"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          number={45}
          suffix=" min"
          label="Avg. Time Saved"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
        />
        <StatCard
          number={archivedCases.length}
          label="Archived"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
        />
      </div>

      {/* Caseload */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your caseload</h2>
          <div className="flex items-center gap-2">
            {archivedCases.length > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                {showArchived ? 'Hide' : 'Show'} archived ({archivedCases.length})
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition-colors cursor-pointer shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Client
            </button>
          </div>
        </div>

        {cases.length === 0 && (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">No active cases. Click "Add Client" to get started.</p>
          </div>
        )}

        <div className="space-y-3">
          {cases.map((c) => {
            const risk = RISK_LABELS[c.riskLevel]
            const isClosed = c.status === 'Closed'
            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border border-gray-100 p-4 sm:p-5 hover:border-brand-200 hover:shadow-md transition-all group ${isClosed ? 'opacity-60 hover:opacity-100' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <button
                    onClick={() => handleCaseClick(c)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    {c.clientName.split(' ').map(n => n[0]).join('')}
                  </button>

                  {/* Info — clickable */}
                  <button
                    onClick={() => handleCaseClick(c)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{c.clientName}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[c.status]}`} />
                      <span className="text-xs text-gray-400">{c.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{c.summary}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">{formatDate(c.lastContact)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${risk.color}`}>
                        {risk.text} risk
                      </span>
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-center">
                    {isClosed && (
                      <button
                        onClick={(e) => handleArchive(e, c.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Archive this case"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        Archive
                      </button>
                    )}
                    <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-600">
                      <span className="text-xs font-medium">Open</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Archived cases section */}
        {showArchived && archivedCases.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              Archived
            </h3>
            <div className="space-y-2">
              {archivedCases.map((c) => (
                <div
                  key={c.id}
                  className="bg-gray-50 rounded-xl border border-gray-100 p-3 sm:p-4 flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs flex-shrink-0">
                    {c.clientName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-600">{c.clientName}</span>
                    <p className="text-xs text-gray-400 truncate">{c.summary}</p>
                  </div>
                  <button
                    onClick={() => handleRestore(c.id)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer px-2.5 py-1.5 bg-brand-50 rounded-lg hover:bg-brand-100"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onAdd={addCase}
        />
      )}
    </div>
  )
}
