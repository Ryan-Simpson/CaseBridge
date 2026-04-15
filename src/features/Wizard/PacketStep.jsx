import { useEffect, useRef, useState } from 'react'
import { useCaseSession } from '../../context/useCaseSession'
import { renderPackets } from '../../lib/llm-client'
import { renderPacketPdf, downloadBlob } from '../../lib/packet-pdf'
import { PROGRAM_ICONS, PROGRAM_NAMES } from '../../lib/programs'

export default function PacketStep() {
  const { caseSession, setActiveStep, updateAgentStatus } = useCaseSession()
  const profile = caseSession.clientProfile
  const eligibleResults = (caseSession.eligibility || []).filter((r) => r.eligible)
  const [cards, setCards] = useState([])
  const [isLoading, setIsLoading] = useState(eligibleResults.length > 0)
  const [error, setError] = useState(null)
  const renderedRef = useRef(false)

  useEffect(() => {
    if (renderedRef.current || !profile || eligibleResults.length === 0) return
    renderedRef.current = true
    Promise.resolve()
      .then(() => {
        updateAgentStatus('packet', 'running')
        return renderPackets(profile, eligibleResults.map((r) => r.program_id))
      })
      .then((actionCards) => {
        setCards(actionCards)
        updateAgentStatus('packet', 'done')
      })
      .catch((err) => {
        setError(`Packet generation failed: ${err.message}`)
        updateAgentStatus('packet', 'error')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [profile, eligibleResults, updateAgentStatus])

  const handleDownload = async (card) => {
    try {
      const blob = await renderPacketPdf({
        programId: card.program_id,
        profile,
        actionCard: card,
      })
      downloadBlob(blob, `${card.program_id}-${profile.client_name || 'client'}.pdf`.replace(/\s+/g, '-'))
    } catch (err) {
      setError(`PDF render failed: ${err.message}`)
    }
  }

  if (!profile || eligibleResults.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-amber-900">Nothing to pack yet</h2>
          <p className="text-sm text-amber-700 mt-2">
            {!profile
              ? 'Complete the intake interview first.'
              : 'No programs matched eligibility. Review the profile and try again.'}
          </p>
          <button
            onClick={() => setActiveStep(profile ? 'eligibility' : 'intake')}
            className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors cursor-pointer"
          >
            {profile ? '← Back to eligibility' : 'Back to intake'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-serif font-bold text-gray-900">Application packet</h2>
        <p className="text-sm text-gray-500 mt-1">
          Download a pre-filled application for each eligible program. Review
          before submission — the caseworker is always the human in the loop.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Generating action cards…
        </div>
      )}

      {!isLoading && cards.length > 0 && (
        <div className="space-y-3">
          {cards.map((card) => (
            <PacketCard key={card.program_id} card={card} onDownload={() => handleDownload(card)} />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setActiveStep('eligibility')}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          ← Back to eligibility
        </button>
        <button
          onClick={() => setActiveStep('dashboard')}
          className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Finish session
        </button>
      </div>
    </div>
  )
}

function PacketCard({ card, onDownload }) {
  const icon = PROGRAM_ICONS[card.program_id] || '📋'
  const name = PROGRAM_NAMES[card.program_id] || card.program_id

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0" aria-hidden>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <button
              onClick={onDownload}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </button>
          </div>
          {card.notes && (
            <p className="text-xs text-gray-500 mb-2">{card.notes}</p>
          )}
          {card.docs_needed?.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Documents to bring
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {card.docs_needed.map((doc, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600"
                  >
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {card.submission_url && (
            <div className="mt-2 text-[11px] text-brand-700">
              Submit to:{' '}
              <a href={card.submission_url} target="_blank" rel="noopener noreferrer" className="underline">
                {card.submission_url}
              </a>
            </div>
          )}
          {card.deadline && (
            <div className="mt-1 text-[11px] text-gray-500">⏰ {card.deadline}</div>
          )}
        </div>
      </div>
    </div>
  )
}
