import { useEffect, useRef, useState } from 'react'

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3)
}

export default function TimeSavedBanner({ targetMinutes = 167, isVisible }) {
  const [minutes, setMinutes] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!isVisible) return
    const duration = 2200
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      setMinutes(Math.round(easeOut(progress) * targetMinutes))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isVisible, targetMinutes])

  if (!isVisible) return null

  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  const display = hrs > 0
    ? `${hrs} hr ${mins > 0 ? `${mins} min` : ''}`
    : `${mins} min`

  return (
    <div className="mt-6 relative overflow-hidden bg-emerald-600 text-white rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-3xl font-bold tabular-nums">
            ~{display}
          </div>
          <div className="text-emerald-100 text-sm mt-1">saved this session</div>
        </div>
        <div className="text-right text-emerald-100 text-xs leading-relaxed">
          <div>Across a 25-case caseload</div>
          <div className="text-white font-semibold">
            that's ~{Math.round(targetMinutes * 25 / 60)} hours/week back with clients
          </div>
        </div>
      </div>
    </div>
  )
}
