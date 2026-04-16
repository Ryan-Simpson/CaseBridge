const STEP_LABELS = {
  dashboard: 'Dashboard',
  intake: 'Intake',
  profile: 'Profile Review',
  eligibility: 'Eligibility',
  packet: 'Packet',
}

const STEP_ORDER = ['intake', 'profile', 'eligibility', 'packet']

export default function Header({ activeStep, onHome, onStepClick }) {
  const inWizard = activeStep !== 'dashboard'
  const currentIndex = STEP_ORDER.indexOf(activeStep)

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <button
            onClick={onHome}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 font-serif hidden sm:block">CaseBridge</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Gemma 4 · Local
            </span>
          </button>

          {inWizard ? (
            <nav className="flex items-center gap-1 sm:gap-2">
              {STEP_ORDER.map((stepId, i) => {
                const isActive = stepId === activeStep
                const isDone = i < currentIndex
                const baseClasses = `flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : isDone
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                      : 'bg-gray-50 text-gray-400 border border-gray-200'
                }`
                const content = (
                  <>
                    <span className="hidden sm:inline">{STEP_LABELS[stepId]}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </>
                )
                return isDone ? (
                  <button
                    key={stepId}
                    onClick={() => onStepClick?.(stepId)}
                    className={baseClasses}
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    key={stepId}
                    className={baseClasses}
                    {...(isActive ? { 'aria-current': 'step' } : {})}
                  >
                    {content}
                  </div>
                )
              })}
            </nav>
          ) : (
            <span className="text-xs text-gray-400">{STEP_LABELS[activeStep]}</span>
          )}
        </div>
      </div>
    </header>
  )
}
