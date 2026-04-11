import { useState, useEffect, useRef, useMemo } from 'react'
import FormField from './FormField'
import Breadcrumb from '../../components/Breadcrumb'
import { FORM_TEMPLATES } from '../../data/form-templates'
import { buildDynamicForms } from '../../lib/dynamic-forms'
import { useCaseSession } from '../../context/CaseContext'

// Map need categories to form template IDs
const NEED_TO_FORM = {
  food: 'calfresh',
  housing: 'erap',
  education: 'school-counseling',
  healthcare: 'school-counseling',
  childcare: 'school-counseling',
}

// Map resource type to form template ID
const TYPE_TO_FORM = {
  'Housing': 'erap',
  'Food Assistance': 'calfresh',
  'Healthcare': 'school-counseling',
  'Education': 'school-counseling',
  'Childcare': 'school-counseling',
}

function getMatchingFormIds(needs) {
  const ids = new Set()
  for (const need of needs) {
    const formId = NEED_TO_FORM[need]
    if (formId) ids.add(formId)
  }
  return ids
}

export default function FormFiller({ onNavigate }) {
  const { caseSession, addTimelineEvent } = useCaseSession()
  const [selectedId, setSelectedId] = useState(null)
  const [isFilling, setIsFilling] = useState(false)
  const [filledForm, setFilledForm] = useState(null)
  const hasAutoSelected = useRef(false)

  const isFromScribe = caseSession.connectedFrom === 'scribe' && caseSession.generatedNote
  const isFromResources = caseSession.connectedFrom === 'resources' && caseSession.selectedResource
  const isConnected = isFromScribe || isFromResources
  const matchingFormIds = isFromScribe ? getMatchingFormIds(caseSession.extractedNeeds) : new Set()

  // Build dynamic forms from session context
  const templates = useMemo(() => {
    if (caseSession.generatedNote || caseSession.clientName) {
      return buildDynamicForms({
        clientName: caseSession.clientName,
        extractedNeeds: caseSession.extractedNeeds,
        generatedNote: caseSession.generatedNote,
        transcript: caseSession.transcript,
      })
    }
    // No context — use static templates
    return FORM_TEMPLATES
  }, [caseSession.clientName, caseSession.extractedNeeds, caseSession.generatedNote, caseSession.transcript])

  // Auto-select form when connected from Resource Brain
  useEffect(() => {
    if (isFromResources && !hasAutoSelected.current && caseSession.selectedResource) {
      hasAutoSelected.current = true
      const formId = TYPE_TO_FORM[caseSession.selectedResource.type]
      if (formId) {
        setSelectedId(formId)
        setFilledForm(null)
        setIsFilling(true)
      }
    }
  }, [isFromResources, caseSession.selectedResource])

  // Auto-select first matching form when connected from Scribe
  useEffect(() => {
    if (isFromScribe && !hasAutoSelected.current && matchingFormIds.size > 0) {
      hasAutoSelected.current = true
      const firstMatch = templates.find((t) => matchingFormIds.has(t.id))
      if (firstMatch) {
        setSelectedId(firstMatch.id)
        setFilledForm(null)
        setIsFilling(true)
      }
    }
  }, [isFromScribe, matchingFormIds, templates])

  const handleSelectForm = (id) => {
    if (id === selectedId && filledForm) return
    setSelectedId(id)
    setFilledForm(null)
    setIsFilling(true)
  }

  useEffect(() => {
    if (!isFilling || !selectedId) return

    const timer = setTimeout(() => {
      const template = templates.find((t) => t.id === selectedId)
      if (template) {
        // If coming from Resource Brain, inject resource info into form fields
        let formData = template
        if (isFromResources && caseSession.selectedResource) {
          const r = caseSession.selectedResource
          const extraFields = [
            { label: 'Referral Resource', value: r.name },
            { label: 'Resource Phone', value: r.phone },
            { label: 'Resource Availability', value: r.availability },
          ]
          formData = {
            ...template,
            fields: [...template.fields, ...extraFields],
          }
        }
        setFilledForm(formData)
        addTimelineEvent({
          type: `form-${selectedId}`,
          label: `${template.name} prepared`,
          detail: template.name,
          icon: 'form',
        })
      }
      setIsFilling(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isFilling, selectedId, isFromResources, caseSession.selectedResource, addTimelineEvent, templates])

  // Build breadcrumb trail
  const trail = isFromResources
    ? ['scribe', 'resources', 'forms']
    : isFromScribe
      ? ['scribe', 'forms']
      : []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {trail.length > 0 && (
        <Breadcrumb trail={trail} current="forms" onNavigate={onNavigate} />
      )}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-serif">Form Filler</h2>
            <p className="text-gray-500 text-sm">
              {isConnected
                ? 'Forms auto-filled from your case data. Review and complete remaining fields.'
                : 'Select a form template to auto-fill from case data.'}
            </p>
          </div>
        </div>
        {isFromResources && caseSession.selectedResource && (
          <div className="mt-3 flex items-center gap-2 text-sm text-brand-700 bg-brand-50 rounded-xl px-4 py-2.5 border border-brand-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            <span>Preparing referral for:</span>
            <span className="font-semibold">{caseSession.selectedResource.name}</span>
          </div>
        )}
      </div>

      <div className="flex gap-6 flex-col md:flex-row">
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectForm(template.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  selectedId === template.id
                    ? 'bg-brand-50 border-2 border-brand-300 shadow-sm'
                    : 'bg-white border-2 border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{template.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm text-gray-900">{template.name}</span>
                      {matchingFormIds.has(template.id) && (
                        <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{template.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {isFromResources && (
            <button
              onClick={() => onNavigate('resources')}
              className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors cursor-pointer"
            >
              &larr; Back to Resources
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1">
          {!selectedId && (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              Select a form template to get started
            </div>
          )}

          {isFilling && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <svg className="animate-spin h-8 w-8 text-brand-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500">Auto-filling form from case data...</span>
            </div>
          )}

          {filledForm && !isFilling && (
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{filledForm.name}</h3>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
                    Ready for review
                  </span>
                </div>
              </div>

              {/* Info banner for fields that need completion */}
              {filledForm.fields.some((f) => f.value === '[To be completed]') && (
                <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div>
                    <span className="font-medium">Some fields need your input.</span>
                    <span className="text-amber-600"> Fields marked [To be completed] should be filled in with the client's information before submitting.</span>
                  </div>
                </div>
              )}

              {/* Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                {filledForm.fields.map((field, i) => (
                  <FormField
                    key={i}
                    label={field.label}
                    value={field.value}
                    needsInput={field.value === '[To be completed]'}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
