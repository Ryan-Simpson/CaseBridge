import { useState, useEffect, useRef, useMemo } from 'react'
import { detectRisks } from '../../lib/risk-detection'
import RiskOverlay from './RiskOverlay'

export default function ScribeOutput({ content, format, onTypingComplete, onRiskFlags }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showFlags, setShowFlags] = useState(false)
  const intervalRef = useRef(null)
  const indexRef = useRef(0)
  const onRiskFlagsRef = useRef(onRiskFlags)
  const onTypingCompleteRef = useRef(onTypingComplete)
  const lastNotifiedContentRef = useRef(null)

  // Keep callback refs up to date without triggering effects
  onRiskFlagsRef.current = onRiskFlags
  onTypingCompleteRef.current = onTypingComplete

  const riskResult = useMemo(() => {
    if (!content) return { flags: [], summary: { red: 0, amber: 0, total: 0 } }
    return detectRisks(content)
  }, [content])

  // Notify parent of risk flags once per content change
  useEffect(() => {
    if (content && content !== lastNotifiedContentRef.current) {
      lastNotifiedContentRef.current = content
      onRiskFlagsRef.current?.(riskResult.flags)
    }
  }, [content, riskResult.flags])

  useEffect(() => {
    if (!content) {
      setDisplayedText('')
      setIsTyping(false)
      setShowFlags(false)
      return
    }

    setDisplayedText('')
    indexRef.current = 0
    setIsTyping(true)
    setShowFlags(false)

    intervalRef.current = setInterval(() => {
      if (indexRef.current < content.length) {
        const next = Math.min(indexRef.current + 3, content.length)
        setDisplayedText(content.slice(0, next))
        indexRef.current = next
      } else {
        clearInterval(intervalRef.current)
        setIsTyping(false)
      }
    }, 10)

    return () => clearInterval(intervalRef.current)
  }, [content])

  // When typing finishes, notify parent and trigger delayed flag reveal
  useEffect(() => {
    if (!isTyping && content && displayedText === content) {
      onTypingCompleteRef.current?.()
      const timer = setTimeout(() => setShowFlags(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [isTyping, content, displayedText])

  const skipTyping = () => {
    if (isTyping && content) {
      clearInterval(intervalRef.current)
      setDisplayedText(content)
      setIsTyping(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.log('Failed to copy to clipboard')
    }
  }

  // Build a set of risk highlight ranges for inline marking
  const highlightRanges = useMemo(() => {
    if (!showFlags || riskResult.flags.length === 0) return []
    return riskResult.flags.map((f) => ({
      index: f.index,
      length: f.length,
      severity: f.severity,
    })).sort((a, b) => a.index - b.index)
  }, [showFlags, riskResult.flags])

  if (!content && !isTyping) return null

  const renderText = (text) => {
    // First split by bold markers
    const boldParts = text.split(/(\*\*[^*]+\*\*)/g)

    // If no risk highlights, render with just bold support
    if (highlightRanges.length === 0) {
      return boldParts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-gray-900 font-semibold">{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })
    }

    // With risk highlights: work on the full text and apply both bold + highlight
    const elements = []
    let cursor = 0

    // Merge bold ranges and highlight ranges
    const allRanges = []

    // Find bold ranges in original text
    const boldRegex = /\*\*[^*]+\*\*/g
    let boldMatch
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      allRanges.push({
        index: boldMatch.index,
        length: boldMatch[0].length,
        type: 'bold',
        display: boldMatch[0].slice(2, -2),
      })
    }

    // Add highlight ranges (only those within text bounds)
    for (const hr of highlightRanges) {
      if (hr.index + hr.length <= text.length) {
        allRanges.push({ ...hr, type: 'highlight' })
      }
    }

    allRanges.sort((a, b) => a.index - b.index)

    for (const range of allRanges) {
      if (range.index < cursor) continue

      // Text before this range
      if (range.index > cursor) {
        elements.push(<span key={`t-${cursor}`}>{text.slice(cursor, range.index)}</span>)
      }

      if (range.type === 'bold') {
        elements.push(
          <strong key={`b-${range.index}`} className="text-gray-900 font-semibold">
            {range.display}
          </strong>
        )
        cursor = range.index + range.length
      } else {
        const highlighted = text.slice(range.index, range.index + range.length)
        elements.push(
          <mark
            key={`h-${range.index}`}
            className={`rounded px-0.5 ${
              range.severity === 'red' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {highlighted}
          </mark>
        )
        cursor = range.index + range.length
      }
    }

    // Remaining text
    if (cursor < text.length) {
      elements.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>)
    }

    return elements
  }

  const { summary } = riskResult

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {format} Note {isTyping && <span className="text-brand-600 animate-pulse">· Writing...</span>}
          </h3>
          {showFlags && summary.total > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded-full">
              {summary.total} Risk Flag{summary.total !== 1 ? 's' : ''} Detected
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isTyping && (
            <button
              onClick={skipTyping}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Skip Animation
            </button>
          )}
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-xs font-medium text-brand-700 bg-brand-50 rounded hover:bg-brand-100 transition-colors cursor-pointer"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div
        onClick={skipTyping}
        className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap cursor-text"
      >
        {renderText(displayedText)}
        {isTyping && <span className="inline-block w-0.5 h-4 bg-brand-600 animate-pulse ml-0.5 align-text-bottom" />}
      </div>
      <RiskOverlay flags={riskResult.flags} isVisible={showFlags} />
    </div>
  )
}
