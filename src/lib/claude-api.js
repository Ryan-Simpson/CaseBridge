import { SYSTEM_PROMPTS, RESOURCE_MATCHING_PROMPT } from './constants'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

/**
 * Core function to call the Claude API via Vite proxy.
 * Returns the text response or null on failure.
 */
export async function callClaude({ systemPrompt, userMessage, maxTokens = 1024 }) {
  if (!API_KEY) {
    console.log('No API key set — falling back to demo data')
    return null
  }

  try {
    const response = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      console.log('Claude API error:', response.status)
      return null
    }

    const data = await response.json()
    return data.content?.[0]?.text ?? null
  } catch (error) {
    console.log('Claude API call failed:', error.message)
    return null
  }
}

/**
 * Generate a case note from a session transcript.
 * Falls back to null if API is unavailable.
 */
export async function generateCaseNote({ transcript, format = 'SOAP' }) {
  const systemPrompt = SYSTEM_PROMPTS[format]
  if (!systemPrompt) return null

  return callClaude({
    systemPrompt,
    userMessage: `Here is the session transcript:\n\n${transcript}`,
    maxTokens: 2048,
  })
}

/**
 * Match community resources to a client description.
 * Returns parsed JSON array or null on failure.
 */
export async function matchResources({ clientDescription }) {
  const result = await callClaude({
    systemPrompt: RESOURCE_MATCHING_PROMPT,
    userMessage: `Client situation:\n\n${clientDescription}`,
    maxTokens: 2048,
  })

  if (!result) return null

  try {
    return JSON.parse(result)
  } catch {
    console.log('Failed to parse resource matching response')
    return null
  }
}
