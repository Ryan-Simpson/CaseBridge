import { FORMATS } from '../../lib/constants'
import { DEMO_TRANSCRIPT } from '../../data/demo-transcript'
import VoiceInput, { isSpeechSupported } from './VoiceInput'

const FORMAT_INFO = {
  SOAP: {
    color: 'from-blue-500 to-brand-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    label: 'SOAP Note',
    description: 'Structured clinical format — Subjective, Objective, Assessment, Plan',
    sections: [
      { letter: 'S', name: 'Subjective', desc: "Client's reported feelings & concerns" },
      { letter: 'O', name: 'Objective', desc: 'Observable facts & behaviors' },
      { letter: 'A', name: 'Assessment', desc: 'Clinical analysis & progress' },
      { letter: 'P', name: 'Plan', desc: 'Next steps & referrals' },
    ],
  },
  DAP: {
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    label: 'DAP Note',
    description: 'Streamlined 3-section format — Data, Assessment, Plan',
    sections: [
      { letter: 'D', name: 'Data', desc: 'Session observations & client reports' },
      { letter: 'A', name: 'Assessment', desc: 'Interpretation & progress toward goals' },
      { letter: 'P', name: 'Plan', desc: 'Action steps & interventions' },
    ],
  },
  Narrative: {
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    label: 'Narrative Note',
    description: 'Flowing paragraph format — tells the full story of the session',
    sections: [
      { letter: '1', name: 'Purpose', desc: 'Why the session was held' },
      { letter: '2', name: 'Discussion', desc: 'Topics covered & client presentation' },
      { letter: '3', name: 'Outcome', desc: 'Progress & next steps' },
    ],
  },
}

export default function ScribeInput({ transcript, setTranscript, format, setFormat, onGenerate, isLoading }) {
  const info = FORMAT_INFO[format]

  return (
    <div className="space-y-5">
      {/* Format selector — tab style */}
      <div className="flex gap-2">
        {FORMATS.map((f) => {
          const fi = FORMAT_INFO[f]
          const isActive = format === f
          return (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`flex-1 py-3 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border-2 ${
                isActive
                  ? `bg-gradient-to-r ${fi.color} text-white border-transparent shadow-md`
                  : `bg-white ${fi.border} ${fi.text} hover:shadow-sm`
              }`}
            >
              {fi.label}
            </button>
          )
        })}
      </div>

      {/* Format description card */}
      <div className={`${info.bg} rounded-2xl p-4 border ${info.border}`}>
        <p className={`text-sm font-medium ${info.text} mb-3`}>{info.description}</p>
        <div className="flex gap-2 flex-wrap">
          {info.sections.map((s) => (
            <div key={s.letter} className="flex items-center gap-2 bg-white/80 rounded-lg px-3 py-1.5 text-xs">
              <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${info.color} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                {s.letter}
              </span>
              <div>
                <span className="font-semibold text-gray-700">{s.name}</span>
                <span className="text-gray-400 ml-1 hidden sm:inline">— {s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setTranscript(DEMO_TRANSCRIPT)}
          className="px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors cursor-pointer border border-brand-100"
        >
          Load Demo
        </button>
        <button
          onClick={onGenerate}
          disabled={!transcript.trim() || isLoading}
          className={`px-6 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md bg-gradient-to-r ${info.color}`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : `Generate ${info.label}`}
        </button>
        <VoiceInput
          onTranscript={(text) => setTranscript((prev) => prev + (prev ? ' ' : '') + text)}
          disabled={isLoading}
        />
      </div>

      {/* Transcript input */}
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Paste a session transcript here, or click Load Demo to try a sample..."
        className={`w-full h-56 p-4 border rounded-2xl text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400 shadow-sm ${info.border} focus:border-brand-500`}
      />

      {isSpeechSupported && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
          Click the mic and describe your client meeting naturally
        </p>
      )}
    </div>
  )
}
