import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'
import IntakeStep from './features/Wizard/IntakeStep'
import ProfileReviewStep from './features/Wizard/ProfileReviewStep'
import EligibilityStep from './features/Wizard/EligibilityStep'
import PacketStep from './features/Wizard/PacketStep'
import AgentSidebar from './features/Wizard/AgentSidebar'
import { useCaseSession } from './context/useCaseSession'

const STEP_COMPONENTS = {
  intake: IntakeStep,
  profile: ProfileReviewStep,
  eligibility: EligibilityStep,
  packet: PacketStep,
}

function App() {
  const { caseSession, setActiveStep } = useCaseSession()
  const { activeStep } = caseSession

  const StepComponent = STEP_COMPONENTS[activeStep]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header
        activeStep={activeStep}
        onHome={() => setActiveStep('dashboard')}
      />
      <main className="flex-1 flex">
        <AgentSidebar />
        <div className="flex-1 min-w-0">
          {activeStep === 'dashboard' && (
            <Dashboard onStartWizard={() => setActiveStep('intake')} />
          )}
          {StepComponent && <StepComponent />}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
