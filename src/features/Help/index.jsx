import { useState, useRef, useEffect } from 'react'
import { HELP_TOPICS, SUGGESTED_QUESTIONS } from '../../data/help-knowledge'
import { callClaude } from '../../lib/claude-api'

function findTopics(query) {
  const q = query.toLowerCase()
  const scored = HELP_TOPICS.map((topic) => {
    let score = 0
    for (const kw of topic.keywords) {
      if (q.includes(kw)) score += 10
      // Partial matches
      const words = kw.split(' ')
      for (const w of words) {
        if (q.includes(w) && w.length > 2) score += 3
      }
    }
    return { topic, score }
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 2).map((s) => s.topic)
}

function formatBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'
      }`}>
        {isUser ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        )}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-600 text-white rounded-br-md'
            : 'bg-gray-50 text-gray-700 rounded-bl-md border border-gray-100'
        }`}>
          {message.lines ? (
            <div className="space-y-2 text-left">
              {message.lines.map((line, i) => (
                <p key={i}>{formatBold(line)}</p>
              ))}
            </div>
          ) : (
            <p>{message.text}</p>
          )}
        </div>

        {/* Links */}
        {message.links && message.links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-brand-600 hover:bg-brand-50 hover:border-brand-200 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Help() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm your CaseBridge assistant. Ask me about government programs, benefits, or community resources — I'll find the right links and info for you.",
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (text) => {
    const query = text || input.trim()
    if (!query) return
    setInput('')

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', text: query }])
    setIsTyping(true)

    // Search local knowledge base first
    const matchedTopics = findTopics(query)

    if (matchedTopics.length > 0) {
      // Build response from knowledge base
      const responses = matchedTopics.map((topic) => ({
        role: 'assistant',
        lines: topic.response.split('\n').filter((l) => l.trim()),
        links: topic.links,
      }))

      // Simulate a brief "thinking" delay
      await new Promise((r) => setTimeout(r, 600))
      setIsTyping(false)
      setMessages((prev) => [...prev, ...responses])
    } else {
      // Try Claude API for general questions
      try {
        const result = await callClaude({
          systemPrompt: `You are a helpful assistant for social workers. Answer questions about government assistance programs, community resources, and social services. Keep answers concise (3-5 sentences). If you mention a website or resource, format it clearly. Focus on practical, actionable information. If you don't know something specific, suggest calling 211 as a starting point.`,
          userMessage: query,
          maxTokens: 512,
        })

        setIsTyping(false)

        if (result) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              lines: result.split('\n').filter((l) => l.trim()),
              links: [{ label: 'Find local help via 211', url: 'https://www.211.org' }],
            },
          ])
        } else {
          // Fallback when no API key
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              text: "I don't have specific info on that topic in my database, but I'd recommend starting with 211 — they can connect you with local resources for almost any need. Just dial 2-1-1 or visit 211.org.",
              links: [
                { label: 'Find help via 211', url: 'https://www.211.org' },
                { label: 'BenefitsCal.com', url: 'https://benefitscal.com' },
                { label: 'FindTreatment.gov', url: 'https://findtreatment.gov' },
              ],
            },
          ])
        }
      } catch {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: "I'm having trouble connecting right now. For immediate help, dial 2-1-1 to reach local resources, or visit the links below.",
            links: [
              { label: '211.org', url: 'https://www.211.org' },
              { label: 'BenefitsCal.com', url: 'https://benefitscal.com' },
            ],
          },
        ])
      }
    }

    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-serif">Help Center</h2>
            <p className="text-gray-500 text-sm">
              Ask about government programs, benefits, or community resources.
            </p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {/* Suggested questions — shown after first assistant message */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="px-4 py-3 bg-gray-50 rounded-2xl rounded-bl-md border border-gray-100">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-100 p-3 sm:p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about benefits, programs, or resources..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white placeholder:text-gray-400"
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
