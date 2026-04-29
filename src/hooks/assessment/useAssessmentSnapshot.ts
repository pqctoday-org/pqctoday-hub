// SPDX-License-Identifier: GPL-3.0-only
import { useAssessmentStore } from '@/store/useAssessmentStore'
import type { AssessmentInput, AssessmentResult } from '@/hooks/assessmentTypes'

export interface AssessmentSnapshot {
  input: AssessmentInput | null
  result: AssessmentResult | null
  hasAssessment: boolean
  completedAt: string | null
}

export function useAssessmentSnapshot(): AssessmentSnapshot {
  const getInput = useAssessmentStore(
    (s) => (s as { getInput?: () => AssessmentInput | null }).getInput
  )
  const result = useAssessmentStore((s) => s.lastResult)
  const completedAt = useAssessmentStore((s) => s.completedAt)

  const input = typeof getInput === 'function' ? getInput() : null
  const hasAssessment = input !== null || result !== null

  return { input, result, hasAssessment, completedAt }
}
