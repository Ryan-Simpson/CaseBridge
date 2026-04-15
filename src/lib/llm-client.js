const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

async function post(path, body) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`${path} → ${response.status}`)
  }
  return response.json()
}

export async function startSession() {
  return post('/session/start', {})
}

export async function setSessionLanguage(sessionId, language) {
  return post('/session/language', { session_id: sessionId, language })
}

export async function streamIntakeTurn({
  sessionId,
  userText,
  onDelta,
  onProfileUpdate,
  onAgentError,
  onDone,
}) {
  const response = await fetch(`${BACKEND_URL}/intake/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, user_text: userText }),
  })
  if (!response.ok || !response.body) {
    throw new Error(`intake/turn → ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let idx
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const dataLine = frame.split('\n').find((l) => l.startsWith('data: '))
      if (!dataLine) continue
      try {
        const payload = JSON.parse(dataLine.slice(6))
        if (payload.type === 'delta') onDelta?.(payload.text)
        else if (payload.type === 'profile') onProfileUpdate?.(payload.profile)
        else if (payload.type === 'error') onAgentError?.(payload.message)
        else if (payload.type === 'done') onDone?.(payload)
      } catch (err) {
        console.warn('Malformed SSE frame:', err.message)
      }
    }
  }
}

export async function finalizeProfile(sessionId) {
  return post('/profile/finalize', { session_id: sessionId })
}

export async function screenEligibility(profile) {
  return post('/eligibility/screen', { profile })
}

export async function renderPackets(profile, programIds) {
  return post('/packet/render', { profile, program_ids: programIds })
}
