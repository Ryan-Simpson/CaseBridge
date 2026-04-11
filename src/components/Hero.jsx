export default function Hero({ onNavigate }) {
  const stats = [
    { value: '60-70%', label: 'of caseworker time spent on admin tasks', color: 'text-brand-600' },
    { value: '2-3x', label: 'recommended caseload ratios exceeded', color: 'text-teal-600' },
    { value: '~45 min', label: 'saved per case note with AI assistance', color: 'text-emerald-600' },
  ]

  const features = [
    {
      tab: 'scribe',
      title: 'The Scribe',
      description: 'Transform session transcripts into professional SOAP, DAP, or Narrative case notes in seconds.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      tab: 'resources',
      title: 'Resource Brain',
      description: 'Describe a client situation and instantly match to relevant community resources and programs.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      ),
    },
    {
      tab: 'forms',
      title: 'Form Filler',
      description: 'Auto-populate referral forms and applications from case data — no re-typing needed.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      ),
    },
  ]

  return (
    <div>
      {/* Hero section */}
      <section className="text-center py-16 sm:py-20 px-4">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
          Every minute on paperwork is a minute away from the people who need you
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          CaseBridge uses AI to automate case notes, match resources, and fill forms — so caseworkers can focus on what matters.
        </p>
        <button
          onClick={() => onNavigate('scribe')}
          className="mt-8 px-8 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 active:bg-brand-800 transition-colors cursor-pointer shadow-sm hover:shadow-md"
        >
          Try The Scribe
        </button>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-center text-2xl font-bold text-gray-900 font-serif mb-8">
          Three tools, one mission
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <button
              key={feature.tab}
              onClick={() => onNavigate(feature.tab)}
              className="text-left bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 group-hover:bg-brand-100 transition-colors">
                {feature.icon}
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
