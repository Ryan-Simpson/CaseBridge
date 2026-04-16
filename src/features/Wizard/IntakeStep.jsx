import { useState, useRef, useEffect, useCallback } from 'react'
import { useCaseSession } from '../../context/useCaseSession'
import { streamIntakeTurn, setSessionLanguage } from '../../lib/llm-client'
import VoiceInput from '../../components/VoiceInput'
import SessionTimer from '../../components/SessionTimer'

const OPENING_MESSAGE = (
  "Hi, I'm here to help you capture this intake quickly. Can you tell me " +
  "the client's name and a sentence or two about what brought them in today? " +
  "You can change the language above to respond in any other language."
)

export default function IntakeStep() {
  const { caseSession, updateSession, setActiveStep, updateAgentStatus } = useCaseSession()
  // Seed the language from the current profile if we have one — this keeps
  // the UI in sync with the backend when the user navigates Intake → Profile
  // Review → back to Intake without starting a new case.
  const initialLanguage = caseSession.clientProfile?.preferred_language || 'English'
  const [language, setLanguage] = useState(initialLanguage)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: OPENING_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const committedLanguageRef = useRef(initialLanguage)

  const commitLanguage = useCallback(async () => {
    const value = language.trim() || 'English'
    if (value === committedLanguageRef.current) return
    if (!caseSession.sessionId) {
      committedLanguageRef.current = value
      return
    }
    try {
      await setSessionLanguage(caseSession.sessionId, value)
      committedLanguageRef.current = value
    } catch (err) {
      setError(`Could not update language: ${err.message}`)
    }
  }, [language, caseSession.sessionId])

  // Auto-scroll to newest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isStreaming])

  const handleSubmit = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming || !caseSession.sessionId) return

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: '' },
    ])
    setInput('')
    setIsStreaming(true)
    setError(null)
    updateAgentStatus('intake', 'running')

    let hadAgentError = false
    try {
      await streamIntakeTurn({
        sessionId: caseSession.sessionId,
        userText: trimmed,
        onDelta: (delta) => {
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last?.role === 'assistant') {
              next[next.length - 1] = { ...last, text: last.text + delta }
            }
            return next
          })
        },
        onProfileUpdate: (profile) => {
          updateSession({ clientProfile: profile })
        },
        onLanguageDetected: (detected) => {
          setLanguage(detected)
          committedLanguageRef.current = detected
          setSessionLanguage(caseSession.sessionId, detected).catch(() => {})
        },
        onAgentError: (message) => {
          hadAgentError = true
          setError(`Agent: ${message}`)
          updateAgentStatus('intake', 'error')
        },
        onDone: () => {
          if (!hadAgentError) updateAgentStatus('intake', 'done')
        },
      })
    } catch (err) {
      updateAgentStatus('intake', 'error')
      setError(`Intake stream failed: ${err.message}`)
    } finally {
      setIsStreaming(false)
    }
  }, [caseSession.sessionId, isStreaming, updateSession, updateAgentStatus])

  const handleFormSubmit = (e) => {
    e.preventDefault()
    handleSubmit(input)
  }

  const handleFinishIntake = () => {
    setActiveStep('profile')
  }

  const canFinish = !!caseSession.clientProfile && !isStreaming

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col h-[calc(100vh-3.5rem-6rem)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Intake</h2>
          <p className="text-sm text-gray-500 mt-1">
            Describe the client's situation in your own words. The agent will ask follow-ups
            and build a profile as you go.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SessionTimer />
          <div className="flex flex-col items-end gap-1">
          <label htmlFor="intake-language" className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Language
          </label>
          <input
            id="intake-language"
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            onBlur={commitLanguage}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            disabled={isStreaming}
            placeholder="English"
            title="Type any language — Spanish, Vietnamese, Mandarin Chinese, Tagalog, etc."
            className="w-40 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50"
          />
        </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div role="log" aria-live="polite" className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} text={msg.text} isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleFormSubmit} className="mt-4 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(input)
            }
          }}
          rows={2}
          placeholder="Type your reply… (Enter to send, Shift+Enter for newline)"
          disabled={isStreaming}
          className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-60"
        />
        <VoiceInput onTranscript={(t) => setInput((prev) => (prev ? `${prev} ${t}` : t))} disabled={isStreaming} />
        <button
          type="submit"
          disabled={isStreaming || !input.trim() || !caseSession.sessionId}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Send
        </button>
      </form>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>
          {caseSession.sessionId
            ? `Session ${caseSession.sessionId.slice(0, 8)}`
            : 'Connecting…'}
        </span>
        <button
          onClick={handleFinishIntake}
          disabled={!canFinish}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Finish intake →
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ role, text, isStreaming }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-600 text-white'
            : 'bg-white border border-gray-200 text-gray-800'
        }`}
      >
        {text}
        {isStreaming && text.length === 0 && (
          <span className="inline-flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
        {isStreaming && text.length > 0 && (
          <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-gray-400 animate-pulse" />
        )}
      </div>
    </div>
  )
}
