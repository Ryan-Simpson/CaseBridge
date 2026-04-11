import { useState } from 'react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'
import SessionTimeline from './components/SessionTimeline'
import ExportSummary from './components/ExportSummary'
import Scribe from './features/Scribe'
import ResourceBrain from './features/ResourceBrain'
import FormFiller from './features/FormFiller'
import Help from './features/Help'

function App() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1">
        {activeTab === 'home' && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === 'scribe' && <Scribe onNavigate={setActiveTab} />}
        {activeTab === 'resources' && <ResourceBrain onNavigate={setActiveTab} />}
        {activeTab === 'forms' && <FormFiller onNavigate={setActiveTab} />}
        {activeTab === 'help' && <Help />}
      </main>
      <Footer />
      <SessionTimeline onNavigate={setActiveTab} />
      <ExportSummary />
    </div>
  )
}

export default App
