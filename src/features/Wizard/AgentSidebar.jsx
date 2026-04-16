import { useCaseSession } from '../../context/useCaseSession'

const AGENTS = [
  { id: 'intake', label: 'Intake' },
  { id: 'risk', label: 'Risk' },
  { id: 'profile', label: 'Profile' },
  { id: 'research', label: 'Research' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'packet', label: 'Packet' },
]

const STATUS_STYLES = {
  idle: { dot: 'bg-gray-300', label: 'text-gray-400' },
  running: { dot: 'bg-blue-500 animate-pulse', label: 'text-blue-600' },
  done: { dot: 'bg-emerald-500', label: 'text-emerald-600' },
  error: { dot: 'bg-red-500', label: 'text-red-600' },
}

export default function AgentSidebar() {
  const { caseSession } = useCaseSession()

  if (caseSession.activeStep === 'dashboard') return null

  return (
    <aside className="hidden lg:block w-56 flex-shrink-0 border-r border-gray-100 px-5 py-8">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Agents
      </h3>
      <ul className="space-y-3" aria-live="polite">
        {AGENTS.map((agent) => {
          const status = caseSession.agentStatus[agent.id] || 'idle'
          const style = STATUS_STYLES[status]
          return (
            <li key={agent.id} className="flex items-center gap-2.5 text-sm">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
              <span className={`font-medium ${style.label}`}>{agent.label}</span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
