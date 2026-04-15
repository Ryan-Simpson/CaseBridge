import { useState, useRef, useEffect, useCallback } from 'react'

const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

export const isSpeechSupported = !!SpeechRecognition

export default function VoiceInput({ onTranscript, disabled }) {
  const [isRecording, setIsRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef(null)
  const wantRecordingRef = useRef(false)
  const onTranscriptRef = useRef(onTranscript)
  const startNewRecognitionRef = useRef(null)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  })

  const stopRecording = useCallback(() => {
    wantRecordingRef.current = false
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // recognition already stopped
      }
      recognitionRef.current = null
    }
    setIsRecording(false)
    setInterim('')
  }, [])

  const startNewRecognition = useCallback(() => {
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let finalText = ''
      let currentInterim = ''

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += transcript
        } else {
          currentInterim += transcript
        }
      }

      setInterim(currentInterim)

      if (finalText.trim()) {
        onTranscriptRef.current(finalText.trim())
        setInterim('')
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed' ||
          event.error === 'network' || event.error === 'audio-capture') {
        stopRecording()
      }
    }

    recognition.onend = () => {
      if (!wantRecordingRef.current) {
        setIsRecording(false)
        recognitionRef.current = null
        return
      }

      setTimeout(() => {
        if (!wantRecordingRef.current) return
        try {
          const newRec = startNewRecognitionRef.current?.()
          if (newRec) {
            recognitionRef.current = newRec
            newRec.start()
          }
        } catch {
          stopRecording()
        }
      }, 300)
    }

    return recognition
  }, [stopRecording])

  useEffect(() => {
    startNewRecognitionRef.current = startNewRecognition
  }, [startNewRecognition])

  const startRecording = useCallback(async () => {
    if (!SpeechRecognition || disabled) return

    setInterim('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
    } catch {
      return
    }

    wantRecordingRef.current = true

    try {
      const recognition = startNewRecognition()
      recognitionRef.current = recognition
      recognition.start()
      setIsRecording(true)
    } catch {
      wantRecordingRef.current = false
    }
  }, [disabled, startNewRecognition])

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  useEffect(() => {
    return () => {
      wantRecordingRef.current = false
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // recognition already stopped
        }
      }
    }
  }, [])

  if (!SpeechRecognition) return null

  return (
    <div className="relative">
      <button
        onClick={toggleRecording}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isRecording
            ? 'bg-red-500 text-white animate-pulse hover:bg-red-600 shadow-md'
            : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
        }`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
        {isRecording ? (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {interim ? 'Hearing you...' : 'Listening...'}
          </span>
        ) : (
          <span className="hidden sm:inline">Mic</span>
        )}
      </button>

      {isRecording && interim && (
        <div className="absolute top-full left-0 mt-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-600 max-w-xs truncate z-10 shadow-sm">
          {interim}
        </div>
      )}
    </div>
  )
}
