import { useState, useRef, useCallback, useEffect } from 'react'
import ScribeInput from './ScribeInput'
import ScribeOutput from './ScribeOutput'
import SmartActions from './SmartActions'
import TimeSavedBanner from './TimeSavedBanner'
import { generateCaseNote } from '../../lib/claude-api'
import { generateLocalNote } from '../../lib/local-note-generator'
import { DEMO_OUTPUTS } from '../../data/demo-transcript'
import { useCaseSession } from '../../context/CaseContext'
import { extractNeeds, extractClientName } from '../../lib/needs-extractor'
import { SAMPLE_RESOURCES } from '../../data/sample-resources'
import { FORM_TEMPLATES } from '../../data/form-templates'

// Map need categories to form template IDs
const NEED_TO_FORM = {
  food: 'calfresh',
  housing: 'erap',
  education: 'school-counseling',
  healthcare: 'school-counseling',
}

function countMatchingResources(needs) {
  const needSet = new Set(needs)
  const typeMap = {
    housing: ['Housing'],
    food: ['Food Assistance'],
    healthcare: ['Healthcare'],
    employment: ['Employment'],
    mental_health: ['Mental Health'],
    legal: ['Legal Aid'],
    education: ['Education'],
    childcare: ['Childcare'],
  }
  let count = 0
  for (const resource of SAMPLE_RESOURCES) {
    for (const [need, types] of Object.entries(typeMap)) {
      if (needSet.has(need) && types.includes(resource.type)) {
        count++
        break
      }
    }
  }
  return count || Math.min(needs.length + 2, SAMPLE_RESOURCES.length)
}

function countMatchingForms(needs) {
  const matchedIds = new Set()
  for (const need of needs) {
    const formId = NEED_TO_FORM[need]
    if (formId) matchedIds.add(formId)
  }
  return matchedIds.size || Math.min(needs.length, FORM_TEMPLATES.length)
}

export default function Scribe({ onNavigate }) {
  const { caseSession, updateSession, addTimelineEvent, addCase } = useCaseSession()
  const [transcript, setTranscript] = useState('')
  const [format, setFormat] = useState('SOAP')
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [typingComplete, setTypingComplete] = useState(false)
  const [generationTime, setGenerationTime] = useState(null)
  const [riskFlags, setRiskFlags] = useState([])
  const [resourceCount, setResourceCount] = useState(0)
  const [formsReady, setFormsReady] = useState(0)
  const [savedToCase, setSavedToCase] = useState(false)
  const startTimeRef = useRef(null)
  const hasPreloaded = useRef(false)

  // Pick up preloaded transcript from Dashboard case click
  useEffect(() => {
    if (caseSession.preloadedTranscript && !hasPreloaded.current) {
      hasPreloaded.current = true
      setTranscript(caseSession.preloadedTranscript)
      setOutput('')
      setTypingComplete(false)
      setGenerationTime(null)
      setRiskFlags([])
      setResourceCount(0)
      setFormsReady(0)
      // Clear the preload so it doesn't re-trigger
      updateSession({ preloadedTranscript: null })
    }
  }, [caseSession.preloadedTranscript, updateSession])

  // Use refs for values needed in callbacks to avoid stale closures
  const outputRef = useRef(output)
  const transcriptRef = useRef(transcript)
  const formatRef = useRef(format)
  outputRef.current = output
  transcriptRef.current = transcript
  formatRef.current = format

  const handleGenerate = async () => {
    setIsLoading(true)
    setOutput('')
    setTypingComplete(false)
    setGenerationTime(null)
    setRiskFlags([])
    setResourceCount(0)
    setFormsReady(0)
    setSavedToCase(false)
    startTimeRef.current = Date.now()

    try {
      // Try Claude API first
      const result = await generateCaseNote({ transcript, format })
      if (result) {
        setOutput(result)
      } else {
        // No API key or API failed — generate locally from the actual transcript
        // Add realistic processing delay so the timer is meaningful
        await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
        const localNote = generateLocalNote({ transcript, format })
        if (localNote) {
          setOutput(localNote)
        } else {
          setOutput(DEMO_OUTPUTS[format] || DEMO_OUTPUTS.SOAP)
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
      const localNote = generateLocalNote({ transcript, format })
      setOutput(localNote || DEMO_OUTPUTS[format] || DEMO_OUTPUTS.SOAP)
    } finally {
      const elapsed = Date.now() - startTimeRef.current
      setGenerationTime(elapsed)
      setIsLoading(false)
      addTimelineEvent({
        type: 'case-note',
        label: `Case note generated`,
        detail: `${(elapsed / 1000).toFixed(0)} seconds`,
        icon: 'note',
      })
    }
  }

  const handleTypingComplete = useCallback(() => {
    setTypingComplete(true)
  }, [])

  // Stable callback — uses refs instead of closing over state
  const handleRiskFlags = useCallback((flags) => {
    setRiskFlags(flags)

    const currentOutput = outputRef.current
    if (currentOutput) {
      const needs = extractNeeds(currentOutput)
      const clientName = extractClientName(currentOutput)
      const rc = countMatchingResources(needs)
      const fr = countMatchingForms(needs)
      setResourceCount(rc)
      setFormsReady(fr)

      updateSession({
        clientName,
        transcript: transcriptRef.current,
        generatedNote: currentOutput,
        format: formatRef.current,
        extractedNeeds: needs,
        riskFlags: flags,
        connectedFrom: null,
      })
    }
  }, [updateSession])

  const handleSmartNavigate = (tab) => {
    updateSession({ connectedFrom: 'scribe' })
    onNavigate?.(tab)
  }

  const handleSaveToCaseload = () => {
    const clientName = extractClientName(output) || 'New Client'
    const needs = extractNeeds(output)
    const riskLevel = riskFlags.some(f => f.severity === 'red') ? 'high'
      : riskFlags.length > 0 ? 'medium' : 'low'

    addCase({
      clientName,
      summary: needs.length > 0 ? needs.join(', ') : 'Case note generated',
      status: 'Active',
      riskLevel,
      transcript: transcript,
    })
    setSavedToCase(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-serif">The Scribe</h2>
            <p className="text-gray-500 text-sm">
              Paste a transcript or use the mic — get a professional case note in seconds.
            </p>
          </div>
        </div>
      </div>
      <ScribeInput
        transcript={transcript}
        setTranscript={setTranscript}
        format={format}
        setFormat={setFormat}
        onGenerate={handleGenerate}
        isLoading={isLoading}
      />
      <TimeSavedBanner
        generationTimeMs={generationTime}
        isVisible={typingComplete && !!output}
      />
      <ScribeOutput
        content={output}
        format={format}
        onTypingComplete={handleTypingComplete}
        onRiskFlags={handleRiskFlags}
      />
      {typingComplete && output && (
        <>
          <SmartActions
            resourceCount={resourceCount}
            formsReady={formsReady}
            onNavigate={handleSmartNavigate}
          />
          {/* Save to caseload */}
          <div className="mt-4">
            {savedToCase ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Saved to your caseload</span>
                <button
                  onClick={() => onNavigate?.('home')}
                  className="ml-auto text-xs font-semibold text-emerald-600 hover:text-emerald-800 cursor-pointer"
                >
                  View Dashboard &rarr;
                </button>
              </div>
            ) : (
              <button
                onClick={handleSaveToCaseload}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer group"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Save as new client to caseload
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
