// SPDX-License-Identifier: AGPL-3.0-only
import type { OpResult } from '@/wasm/kmip/kmipEngine'
import type { LessonStep } from './learnLessons'

// Existing KMIP corpus and kmipMeta use these wire values; Unknown is not a pass.
export function certificateValidity(result: OpResult): string {
  switch (result.summary.validity) {
    case '0x00000001':
      return 'Valid'
    case '0x00000002':
      return 'Invalid'
    case '0x00000003':
      return 'Unknown'
    default:
      return 'Missing or unrecognized'
  }
}

export function lessonStepAchieved(step: LessonStep, result: OpResult): boolean {
  if (result.status === 'Skip') return false
  if (step.expectValidity) {
    return (
      result.ok &&
      result.status === 'Success' &&
      certificateValidity(result) === step.expectValidity
    )
  }
  const want = step.expect ?? 'success'
  return want === 'success'
    ? result.ok
    : want === 'pending'
      ? result.status === 'OperationPending'
      : !result.ok && result.status !== 'Error' && result.status !== 'OperationPending'
}
