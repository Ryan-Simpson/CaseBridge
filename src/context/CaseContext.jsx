import { createContext, useContext, useState, useCallback } from 'react'
import { RECENT_CASES } from '../data/dashboard-data'

const CaseContext = createContext(null)

const INITIAL_STATE = {
  clientName: '',
  transcript: '',
  generatedNote: '',
  format: 'SOAP',
  extractedNeeds: [],
  riskFlags: [],
  connectedFrom: null,
  // Resource → Form connection
  selectedResource: null,
  matchedResources: [],
  // Dashboard → Scribe preload
  preloadedTranscript: null,
  preloadedClientName: null,
}

const INITIAL_TIMELINE = []

export function CaseProvider({ children }) {
  const [caseSession, setCaseSession] = useState(INITIAL_STATE)
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE)

  // Live caseload — starts from demo data, but user can add/archive
  const [cases, setCases] = useState(RECENT_CASES)
  const [archivedCases, setArchivedCases] = useState([])

  const updateSession = useCallback((updates) => {
    setCaseSession((prev) => ({ ...prev, ...updates }))
  }, [])

  const clearSession = useCallback(() => {
    setCaseSession(INITIAL_STATE)
    setTimeline(INITIAL_TIMELINE)
  }, [])

  const addTimelineEvent = useCallback((event) => {
    setTimeline((prev) => {
      const existing = prev.find((e) => e.type === event.type)
      if (existing) {
        return prev.map((e) => (e.type === event.type ? { ...event, timestamp: Date.now() } : e))
      }
      return [...prev, { ...event, timestamp: Date.now() }]
    })
  }, [])

  // Caseload management
  const addCase = useCallback((newCase) => {
    setCases((prev) => [
      {
        id: Date.now(),
        lastContact: new Date().toISOString().split('T')[0],
        ...newCase,
      },
      ...prev,
    ])
  }, [])

  const archiveCase = useCallback((caseId) => {
    setCases((prev) => {
      const toArchive = prev.find((c) => c.id === caseId)
      if (toArchive) {
        setArchivedCases((archived) => [toArchive, ...archived])
      }
      return prev.filter((c) => c.id !== caseId)
    })
  }, [])

  const restoreCase = useCallback((caseId) => {
    setArchivedCases((prev) => {
      const toRestore = prev.find((c) => c.id === caseId)
      if (toRestore) {
        setCases((cases) => [toRestore, ...cases])
      }
      return prev.filter((c) => c.id !== caseId)
    })
  }, [])

  const updateCase = useCallback((caseId, updates) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, ...updates } : c))
    )
  }, [])

  return (
    <CaseContext.Provider value={{
      caseSession, updateSession, clearSession,
      timeline, addTimelineEvent,
      cases, archivedCases, addCase, archiveCase, restoreCase, updateCase,
    }}>
      {children}
    </CaseContext.Provider>
  )
}

export function useCaseSession() {
  const ctx = useContext(CaseContext)
  if (!ctx) throw new Error('useCaseSession must be used within CaseProvider')
  return ctx
}
