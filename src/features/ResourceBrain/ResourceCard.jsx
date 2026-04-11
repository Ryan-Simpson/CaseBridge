const TYPE_COLORS = {
  'Food Assistance': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Housing': 'bg-blue-50 text-blue-700 border-blue-200',
  'Healthcare': 'bg-red-50 text-red-700 border-red-200',
  'Mental Health': 'bg-purple-50 text-purple-700 border-purple-200',
  'Employment': 'bg-amber-50 text-amber-700 border-amber-200',
  'Legal Aid': 'bg-slate-50 text-slate-700 border-slate-200',
  'Education': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Childcare': 'bg-pink-50 text-pink-700 border-pink-200',
}

function getScoreColor(score) {
  if (score > 90) return 'bg-emerald-500'
  if (score > 80) return 'bg-brand-500'
  return 'bg-amber-500'
}

export default function ResourceCard({ resource, onPrepareReferral, showReferralButton }) {
  const { name, type, matchScore, distance, eligibility, availability, phone, notes } = resource
  const badgeClass = TYPE_COLORS[type] || 'bg-gray-50 text-gray-600 border-gray-200'
  const barColor = getScoreColor(matchScore)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all flex flex-col shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 leading-snug">{name}</h3>
          <span className={`inline-block mt-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${badgeClass}`}>
            {type}
          </span>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-lg">{distance}</span>
      </div>

      {/* Match score bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-400 font-medium">Match</span>
          <span className="font-bold text-gray-700">{matchScore}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${matchScore}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 text-sm flex-1">
        <div className="flex gap-2">
          <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">{eligibility}</p>
        </div>
        <div className="flex gap-2">
          <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">{availability}</p>
        </div>
        <div className="flex gap-2">
          <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
          <p className="text-gray-600">{phone}</p>
        </div>
        <p className="text-gray-400 text-xs italic leading-relaxed pt-1 border-t border-gray-100">{notes}</p>
      </div>

      {showReferralButton && onPrepareReferral && (
        <button
          onClick={() => onPrepareReferral(resource)}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-all cursor-pointer shadow-sm hover:shadow-md group"
        >
          Prepare Referral
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}
    </div>
  )
}
