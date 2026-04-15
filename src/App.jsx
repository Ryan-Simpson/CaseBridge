import { useState } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'
import IntakeStep from './features/Wizard/IntakeStep'
import ProfileReviewStep from './features/Wizard/ProfileReviewStep'
import EligibilityStep from './features/Wizard/EligibilityStep'
import PacketStep from './features/Wizard/PacketStep'
import AgentSidebar from './features/Wizard/AgentSidebar'
import { useCaseSession } from './context/useCaseSession'
import { startSession } from './lib/llm-client'

const STEP_COMPONENTS = {
  intake: IntakeStep,
  profile: ProfileReviewStep,
  eligibility: EligibilityStep,
  packet: PacketStep,
}

function App() {
  const { caseSession, updateSession, setActiveStep, clearSession } = useCaseSession()
  const { activeStep } = caseSession
  const [wizardError, setWizardError] = useState(null)

  const StepComponent = STEP_COMPONENTS[activeStep]

  const handleStartWizard = async () => {
    setWizardError(null)
    clearSession()
    setActiveStep('intake')
    try {
      const { session_id } = await startSession()
      updateSession({ sessionId: session_id })
    } catch (err) {
      setWizardError(`Could not reach backend: ${err.message}`)
    }
  }

  const handleGoHome = () => {
    setActiveStep('dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header activeStep={activeStep} onHome={handleGoHome} />
      <main className="flex-1 flex">
        <AgentSidebar />
        <div className="flex-1 min-w-0">
          {wizardError && (
            <div className="mx-auto max-w-3xl px-4 pt-4">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {wizardError}
              </div>
            </div>
          )}
          {activeStep === 'dashboard' && (
            <Dashboard onStartWizard={handleStartWizard} />
          )}
          {StepComponent && <StepComponent />}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
