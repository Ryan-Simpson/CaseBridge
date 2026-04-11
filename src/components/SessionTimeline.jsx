import { useState, useEffect, useRef } from 'react'
import { useCaseSession } from '../context/CaseContext'

const ICON_MAP = {
  note: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  resources: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  form: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  ),
}

const STEP_COLORS = {
  note: 'bg-brand-100 text-brand-700 border-brand-200',
  resources: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  form: 'bg-amber-100 text-amber-700 border-amber-200',
}

// Time savings per action type (in minutes)
const TIME_SAVINGS = {
  'case-note': 45,
  resources: 20,
}
const FORM_TIME_SAVINGS = 15

function formatTimeSaved(minutes) {
  if (minutes < 60) return `~${minutes} min`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `~${hrs} hr ${mins} min` : `~${hrs} hr`
}

function AnimatedCounter({ target }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (target === 0) { setDisplay(0); return }
    const duration = 1500
    const start = performance.now()
    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => ref.current && cancelAnimationFrame(ref.current)
  }, [target])

  return <span>{display}</span>
}

export default function SessionTimeline({ onNavigate }) {
  const { timeline } = useCaseSession()
  const [isExpanded, setIsExpanded] = useState(false)

  if (timeline.length === 0) return null

  // Calculate total time saved
  let totalMinutes = 0
  for (const event of timeline) {
    if (TIME_SAVINGS[event.type]) {
      totalMinutes += TIME_SAVINGS[event.type]
    } else if (event.type.startsWith('form-')) {
      totalMinutes += FORM_TIME_SAVINGS
    }
  }

  const tabMap = {
    'case-note': 'scribe',
    resources: 'resources',
  }

  return (
    <>
      {/* Collapsed bar */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${
          isExpanded ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="flex flex-col items-center gap-1 bg-brand-600 text-white px-2 py-4 rounded-l-lg shadow-lg cursor-pointer hover:bg-brand-700 transition-colors"
          title="Session Timeline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
            {timeline.length} steps
          </span>
        </button>
      </div>

      {/* Expanded panel */}
      <div
        className={`fixed right-0 top-0 h-full z-50 transition-transform duration-300 ${
          isExpanded ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full w-72 bg-white border-l border-gray-200 shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Session Timeline</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Timeline events */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-0">
              {timeline.map((event, i) => {
                const iconType = event.icon || 'note'
                const colorClass = STEP_COLORS[iconType] || STEP_COLORS.note
                const tab = event.type.startsWith('form-') ? 'forms' : tabMap[event.type]
                const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })

                return (
                  <div key={event.type + i} className="relative flex gap-3 pb-6 last:pb-0">
                    {/* Vertical line */}
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />
                    )}

                    {/* Icon circle */}
                    <div className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${colorClass}`}>
                      {ICON_MAP[iconType] || ICON_MAP.note}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => { if (tab) { setIsExpanded(false); onNavigate?.(tab) } }}
                        className={`text-left w-full ${tab ? 'hover:text-brand-600 cursor-pointer' : ''}`}
                      >
                        <p className="text-sm font-medium text-gray-900">{event.label}</p>
                        {event.detail && (
                          <p className="text-xs text-gray-500 truncate">{event.detail}</p>
                        )}
                      </button>
                      <span className="text-xs text-gray-400">{time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Time saved footer */}
          <div className="border-t border-gray-100 px-4 py-4 bg-emerald-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-700">
                {formatTimeSaved(totalMinutes)}
              </div>
              <div className="text-xs text-emerald-600 mt-0.5">saved this session</div>
              {totalMinutes >= 60 && (
                <div className="text-xs text-emerald-500 mt-1">
                  That's {Math.round(totalMinutes / 22)} more client meetings
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/10 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  )
}
