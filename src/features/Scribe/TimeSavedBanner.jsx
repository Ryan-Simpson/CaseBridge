import { useState, useEffect, useRef } from 'react'

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function Sparkle({ delay, left, top }) {
  return (
    <span
      className="absolute w-1 h-1 rounded-full pointer-events-none"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        background: 'rgba(255, 255, 255, 0.9)',
        animation: `sparkle 1.5s ease-out ${delay}s forwards`,
      }}
    />
  )
}

const SPARKLES = [
  { delay: 0, left: 15, top: 20 },
  { delay: 0.2, left: 35, top: 10 },
  { delay: 0.1, left: 55, top: 25 },
  { delay: 0.3, left: 75, top: 15 },
  { delay: 0.15, left: 88, top: 30 },
  { delay: 0.25, left: 45, top: 5 },
]

export default function TimeSavedBanner({ generationTimeMs, isVisible }) {
  const [displayMinutes, setDisplayMinutes] = useState(0)
  const [showSparkles, setShowSparkles] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!isVisible) {
      setDisplayMinutes(0)
      setBannerVisible(false)
      setShowSparkles(false)
      return
    }

    // Fade in the banner
    requestAnimationFrame(() => setBannerVisible(true))

    // Count up animation: 0 → 44 over 2 seconds
    const target = 44
    const duration = 2000
    const start = performance.now()

    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      setDisplayMinutes(Math.round(eased * target))

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setShowSparkles(true)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isVisible])

  if (!isVisible) return null

  const seconds = generationTimeMs ? (generationTimeMs / 1000).toFixed(1) : '—'

  return (
    <>
      <style>{`
        @keyframes sparkle {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(3); opacity: 0.8; }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>
      <div
        className={`mt-6 relative overflow-hidden bg-emerald-600 text-white rounded-lg p-4 transition-all duration-500 ${
          bannerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {showSparkles && SPARKLES.map((s, i) => (
          <Sparkle key={i} {...s} />
        ))}
        <p className="font-medium text-sm sm:text-base">
          Generated in {seconds}s &middot; Manual average: 45 min &middot; You just saved ~{displayMinutes} min
        </p>
        <p className="text-emerald-100 text-xs sm:text-sm mt-1">
          Across a 25-case caseload, that's ~18 hours/week back with your clients
        </p>
      </div>
    </>
  )
}
