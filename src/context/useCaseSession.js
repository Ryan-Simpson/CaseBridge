import { useContext } from 'react'
import { CaseContext } from './case-store'

export function useCaseSession() {
  const ctx = useContext(CaseContext)
  if (!ctx) throw new Error('useCaseSession must be used within CaseProvider')
  return ctx
}
