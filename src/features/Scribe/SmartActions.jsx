import { useState, useEffect } from 'react'

export default function SmartActions({ resourceCount, formsReady, onNavigate }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  if (resourceCount === 0 && formsReady === 0) return null

  return (
    <div
      className={`mt-6 flex flex-col sm:flex-row gap-3 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {resourceCount > 0 && (
        <button
          onClick={() => onNavigate('resources')}
          className="flex items-center gap-3 px-5 py-4 bg-white border border-brand-200 rounded-2xl text-sm font-medium text-brand-700 hover:bg-brand-50 hover:shadow-md transition-all cursor-pointer flex-1 group"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 group-hover:bg-brand-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-semibold">{resourceCount} resource{resourceCount !== 1 ? 's' : ''} matched</div>
            <div className="text-xs text-gray-500 font-normal">View in Resource Brain</div>
          </div>
          <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}
      {formsReady > 0 && (
        <button
          onClick={() => onNavigate('forms')}
          className="flex items-center gap-3 px-5 py-4 bg-white border border-brand-200 rounded-2xl text-sm font-medium text-brand-700 hover:bg-brand-50 hover:shadow-md transition-all cursor-pointer flex-1 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-semibold">{formsReady} form{formsReady !== 1 ? 's' : ''} ready</div>
            <div className="text-xs text-gray-500 font-normal">Auto-fill from case data</div>
          </div>
          <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      )}
    </div>
  )
}
