export default function RiskOverlay({ flags, isVisible }) {
  if (!flags || flags.length === 0) return null

  return (
    <div
      className={`mt-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Risk Summary
      </h3>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {flags.map((flag, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <span
              className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                flag.severity === 'red' ? 'bg-red-500' : 'bg-amber-500'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900">{flag.category}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    flag.severity === 'red'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {flag.severity === 'red' ? 'High' : 'Medium'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{flag.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
