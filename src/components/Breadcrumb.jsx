const TAB_LABELS = {
  home: 'Home',
  scribe: 'The Scribe',
  resources: 'Resource Brain',
  forms: 'Form Filler',
}

export default function Breadcrumb({ trail = [], from, current, onNavigate }) {
  // Support both old (from/current) and new (trail) API
  const steps = trail.length > 0
    ? trail
    : from ? [from, current] : [current]

  if (steps.length < 2) return null

  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 flex-wrap">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        return (
          <span key={step} className="flex items-center gap-1.5">
            {i > 0 && <span>&rarr;</span>}
            {isLast ? (
              <span className="text-gray-700 font-medium">{TAB_LABELS[step] || step}</span>
            ) : (
              <button
                onClick={() => onNavigate(step)}
                className="hover:text-brand-600 transition-colors cursor-pointer"
              >
                {TAB_LABELS[step] || step}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
