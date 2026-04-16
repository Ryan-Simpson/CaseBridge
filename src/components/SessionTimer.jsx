import { useState, useEffect } from 'react'
import { useCaseSession } from '../context/useCaseSession'

export default function SessionTimer({ final: isFinal }) {
  const { caseSession } = useCaseSession()
  const startTime = caseSession.sessionStartTime
  const [elapsed, setElapsed] = useState(() =>
    startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
  )

  useEffect(() => {
    if (!startTime || isFinal) return
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime, isFinal])

  if (!startTime) return null

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  if (isFinal) {
    return (
      <div className="text-sm text-emerald-700 font-medium">
        Completed in {display}
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600 tabular-nums">
      {display}
    </span>
  )
}
