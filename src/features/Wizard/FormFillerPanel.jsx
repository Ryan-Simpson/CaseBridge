import { useCallback, useState } from 'react'
import { streamFormFill } from '../../lib/llm-client'

const DEMO_PORTAL_URLS = {
  calfresh: '/demo-portal/calfresh.html',
  erap: '/demo-portal/calfresh.html',
  wic: '/demo-portal/calfresh.html',
  liheap: '/demo-portal/calfresh.html',
  school_meals: '/demo-portal/calfresh.html',
}

export default function FormFillerPanel({ profile, programId, onClose }) {
  const [events, setEvents] = useState([])
  const [fields, setFields] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const targetUrl = `${window.location.origin}${DEMO_PORTAL_URLS[programId] || DEMO_PORTAL_URLS.calfresh}`

  const start = useCallback(async () => {
    setIsRunning(true)
    setEvents([])
    setFields([])
    setDone(false)
    setError(null)
    try {
      await streamFormFill({
        profile,
        targetUrl,
        onStatus: (msg) => setEvents((prev) => [...prev, { kind: 'status', text: msg }]),
        onFields: (fs) => {
          setFields(fs)
          setEvents((prev) => [...prev, { kind: 'fields', text: `Mapped ${fs.length} fields` }])
        },
        onAgentError: (msg) => setError(msg),
        onDone: ({ filled }) => {
          setEvents((prev) => [...prev, { kind: 'done', text: `Filled ${filled} fields — review and submit` }])
          setDone(true)
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsRunning(false)
    }
  }, [profile, targetUrl])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-serif font-bold text-gray-900">
              Agent: fill portal form
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Gemma 4 E4B drives Playwright MCP. The form fills live in a headless
              browser — the caseworker reviews and submits manually.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-mono break-all text-gray-600">
            <span className="text-gray-400">target: </span>{targetUrl}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Agent log
            </h4>
            <div className="rounded-xl border border-gray-200 bg-black/95 p-3 font-mono text-[11px] leading-relaxed text-emerald-300 min-h-[140px] max-h-[220px] overflow-y-auto">
              {events.length === 0 && !isRunning && !error && (
                <span className="text-gray-500">Click "Run agent" to start.</span>
              )}
              {events.map((e, i) => (
                <div key={i}>
                  <span className="text-gray-500">
                    {e.kind === 'status' ? '▸' : e.kind === 'fields' ? '✓' : '●'}{' '}
                  </span>
                  {e.text}
                </div>
              ))}
              {isRunning && (
                <div className="text-blue-400 animate-pulse">▸ thinking…</div>
              )}
            </div>
          </div>

          {fields.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Fields mapped by Gemma
              </h4>
              <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 text-xs max-h-[220px] overflow-y-auto">
                {fields.map((f, i) => (
                  <li key={i} className="px-3 py-2 flex items-center gap-2">
                    <span className="text-gray-400 font-mono text-[10px] w-12 flex-shrink-0">{f.ref}</span>
                    <span className="flex-1 font-medium text-gray-700 truncate">{f.name}</span>
                    <span className="inline-block rounded-full bg-gray-100 border border-gray-200 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-gray-500 flex-shrink-0">
                      {f.type}
                    </span>
                    <span className="text-gray-900 font-mono text-[11px] flex-shrink-0 max-w-[40%] truncate">
                      {f.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={start}
            disabled={isRunning || done}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isRunning ? 'Running…' : done ? 'Done' : 'Run agent'}
          </button>
        </div>
      </div>
    </div>
  )
}
